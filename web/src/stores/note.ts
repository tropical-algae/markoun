import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";
import { useActionLedger } from "@/composables/useActionLedger";
import type { FileDetail, FsNode } from "@/types/file-system";
import type { AsyncStatus } from "@/types/async";
import { useToastStore } from "@/stores/toast";
import {
  getMediaPath,
  getParentPath,
  isPathInside,
  normalizeNodePath,
  replacePathPrefix,
  ROOT_DIRECTORY_PATH,
} from "@/utils/file-system";
import {
  buildFileDetailShell,
  buildRenamedPath,
  isMarkdownNode,
  isPreviewableImageNode,
  normalizeFsNode,
} from "@/utils/file-node";
import { renderMarkdownFile } from "@/utils/markdown";
import {
  getFileContentApi,
  createNoteApi,
  uploadFileApi,
  saveNoteApi,
  saveNoteKeepalive,
} from "@/api/file";
import { removeItemApi, renameItemApi } from "@/api/item";
import { createDirApi } from "@/api/dir";
import { getWelcomeNoteApi } from "@/api/system";
import { useFileTreeState } from "@/stores/note/file-tree-state";

const DEFAULT_WELCOME_NOTE_CONTENT = `# Welcome to Markoun

Markoun is a lightweight, self-hosted, and entirely file-based Markdown editor designed for users who prioritize privacy and simplicity.

> The UI layout of Markoun is inspired by [Haptic](https://github.com/chroxify/haptic) and [Obsidian](https://github.com/obsidianmd) — both excellent Markdown editing tools.

---

**Useful shortcuts and gestures**

| Action | How |
| --- | --- |
| Rename a file or folder | Long-press its name |
| Upload into a folder | Drag a file onto the folder |
| Paste an image into a note | Press \`Ctrl+V\` in the editor |

Only Markdown files and supported image files appear in the file tree by default.  
To expose more file types, update \`DISPLAYED_FILE_TYPES\` in your configuration.

**LaTeX support**

\`\`\`md
# Example

Inline math: $E = mc^2$

$$
\\int_0^1 x^2\\,dx = \\frac{1}{3}
$$
\`\`\`

---

If you deploy with Docker, this page can be replaced by mounting your own \`welcome.md\`.

Maintained by: **tropical algae**  
Repository: [tropical-algae/markoun](https://github.com/tropical-algae/markoun.git)
`

export const useNodeStore = defineStore('note', () => {
  const createDefaultFileContent = (content: string = DEFAULT_WELCOME_NOTE_CONTENT): FileDetail => ({
    name: 'WELCOME',
    path: '',
    suffix: '',
    content,
    meta: {}
  })

  const fileTree = useFileTreeState()
  const currentNode = ref<FsNode | null>(null)
  const currentFileNode = ref<FsNode | null>(null)
  const currentPreviewImageNode = ref<FsNode | null>(null)
  const welcomeNoteContent = ref(DEFAULT_WELCOME_NOTE_CONTENT)
  const welcomeNoteState = ref<AsyncStatus>('idle')

  const currentFileStatus = ref<AsyncStatus>('idle')
  const currentFile = ref<FileDetail>(createDefaultFileContent())
  const currentParentPath = computed(() => getParentPath(currentNode.value ?? currentFileNode.value))
  const currentFileParentPath = computed(() => getParentPath(currentFileNode.value ?? currentFile.value.path))
  const currentPathLabel = computed(() => currentParentPath.value === ROOT_DIRECTORY_PATH ? '/' : currentParentPath.value)
  const rootNodes = fileTree.rootNodes
  const currentFileDisplayName = computed(() => currentFileNode.value?.name || currentFile.value.name)
  const canEditCurrentFile = computed(() => currentFileStatus.value === 'ready' && Boolean(currentFileNode.value))
  const isCurrentFileDirty = computed(() => {
    return canEditCurrentFile.value && currentFile.value.content !== lastSavedContent.value
  })
  const currentRenderedFile = computed(() => {
    return renderMarkdownFile(currentFile.value.path, currentFile.value.content)
  })
  const currentPreviewImageUrl = computed(() => {
    return currentPreviewImageNode.value
      ? getMediaPath(ROOT_DIRECTORY_PATH, currentPreviewImageNode.value.path)
      : ''
  })

  let isInitialized = false
  let currentFileRequestId = 0
  const lastSavedContent = ref(createDefaultFileContent().content)

  const toastStore = useToastStore()
  const actionLedger = useActionLedger()
  const {
    loadDirectory,
    getDirectoryChildren,
    getDirectoryLoadState,
    isDirectoryExpanded,
    expandDirectory,
    collapseDirectory,
    toggleDirectory,
  } = fileTree

  const resolveDefaultFileStatus = (): AsyncStatus => {
    return welcomeNoteState.value === 'ready' || welcomeNoteState.value === 'error'
      ? 'ready'
      : 'idle'
  }

  const syncDefaultWelcomeFile = () => {
    if (currentFileNode.value || isInitialized) {
      return
    }

    currentFile.value = createDefaultFileContent(welcomeNoteContent.value)
  }

  const resetCurrentFileState = () => {
    currentFileNode.value = null
    currentFile.value = createDefaultFileContent(welcomeNoteContent.value)
    lastSavedContent.value = currentFile.value.content
    currentFileStatus.value = resolveDefaultFileStatus()
    isInitialized = false
  }

  const remapReferencedNode = (
    node: FsNode | null,
    oldPath: string,
    newPath: string,
    exactName: string,
  ): FsNode | null => {
    if (!node) {
      return null
    }

    const nextPath = replacePathPrefix(node.path, oldPath, newPath)
    if (nextPath === node.path) {
      return node
    }

    return {
      ...node,
      path: nextPath,
      name: node.path === oldPath ? exactName : node.name,
    }
  }

  const remapDirectoryTreePathPrefix = (oldPath: string, newPath: string, exactName: string) => {
    fileTree.remapDirectoryTreePathPrefix(oldPath, newPath, exactName)

    currentNode.value = remapReferencedNode(currentNode.value, oldPath, newPath, exactName)
    currentFileNode.value = remapReferencedNode(currentFileNode.value, oldPath, newPath, exactName)
    currentPreviewImageNode.value = remapReferencedNode(
      currentPreviewImageNode.value,
      oldPath,
      newPath,
      exactName,
    )

    const nextCurrentFilePath = replacePathPrefix(currentFile.value.path, oldPath, newPath)
    if (nextCurrentFilePath !== currentFile.value.path) {
      currentFile.value = {
        ...currentFile.value,
        path: nextCurrentFilePath,
        name: currentFile.value.path === oldPath ? exactName : currentFile.value.name,
        meta: {
          ...currentFile.value.meta,
          path: replacePathPrefix(currentFile.value.meta.path || '', oldPath, newPath),
        },
      }
    }
  }

  const removeNodeFromDirectoryTree = (path: string) => {
    const normalizedPath = normalizeNodePath(path)
    fileTree.removeNodeFromDirectoryTree(normalizedPath)

    if (currentPreviewImageNode.value && isPathInside(currentPreviewImageNode.value.path, normalizedPath)) {
      currentPreviewImageNode.value = null
    }
  }

  const ensureWelcomeNoteLoaded = async (): Promise<string> => {
    if (welcomeNoteState.value === 'ready') {
      return welcomeNoteContent.value
    }

    welcomeNoteState.value = 'loading'
    if (!currentFileNode.value && !isInitialized) {
      currentFileStatus.value = 'loading'
    }

    try {
      const response = await getWelcomeNoteApi()
      welcomeNoteContent.value = response.data || DEFAULT_WELCOME_NOTE_CONTENT
      welcomeNoteState.value = 'ready'
      syncDefaultWelcomeFile()
      if (!currentFileNode.value && !isInitialized) {
        currentFileStatus.value = 'ready'
      }
      return welcomeNoteContent.value
    } catch (error) {
      welcomeNoteState.value = 'error'
      welcomeNoteContent.value = DEFAULT_WELCOME_NOTE_CONTENT
      syncDefaultWelcomeFile()
      if (!currentFileNode.value && !isInitialized) {
        currentFileStatus.value = 'ready'
      }
      throw error
    }
  }

  const openImagePreview = (node: FsNode) => {
    currentPreviewImageNode.value = normalizeFsNode(node)
  }

  const closeImagePreview = () => {
    currentPreviewImageNode.value = null
  }

  const upsertNode = (parentPath: string, node: FsNode) => {
    const normalizedNode = fileTree.upsertNode(parentPath, node)

    if (currentNode.value?.path === normalizedNode.path) {
      currentNode.value = normalizedNode
    }
    if (currentFileNode.value?.path === normalizedNode.path) {
      currentFileNode.value = normalizedNode
    }
  }

  const loadCurrentFile = async (node: FsNode) => {
    if (!isMarkdownNode(node)) {
      return
    }

    const normalizedNode = normalizeFsNode(node)
    if (currentFileNode.value?.path === normalizedNode.path) {
      if (currentFileStatus.value === 'ready') {
        currentNode.value = normalizedNode
        return
      }
      if (currentFileStatus.value === 'loading') {
        currentNode.value = normalizedNode
        return
      }
    }

    const requestId = ++currentFileRequestId

    currentNode.value = normalizedNode
    currentFileNode.value = normalizedNode
    currentFile.value = buildFileDetailShell(normalizedNode)
    currentFileStatus.value = 'loading'
    isInitialized = false

    try {
      const response = await getFileContentApi(normalizedNode.path)
      if (
        requestId !== currentFileRequestId
        || currentFileNode.value?.path !== normalizedNode.path
      ) {
        return
      }

      const nextFile = {
        name: normalizedNode.name,
        path: normalizedNode.path,
        suffix: normalizedNode.suffix,
        content: response.data.content,
        meta: response.data.meta
      }
      currentFile.value = nextFile
      lastSavedContent.value = nextFile.content
      currentFileStatus.value = 'ready'
      isInitialized = true
    } catch (error) {
      if (
        requestId !== currentFileRequestId
        || currentFileNode.value?.path !== normalizedNode.path
      ) {
        return
      }

      currentFileStatus.value = 'error'
      currentFile.value = buildFileDetailShell(normalizedNode)
    }
  }

  const addNewNode = async (noteName: string, type: 'file' | 'dir') => {
    const parentPath = currentParentPath.value
    const actionKey = type === 'file' ? 'create-file' : 'create-dir'
    const response = await actionLedger.runAction(actionKey, async () => {
      return type === 'file'
        ? await createNoteApi(parentPath, noteName)
        : await createDirApi(parentPath, noteName)
    })

    await fileTree.ensureDirectoryVisible(parentPath)
    upsertNode(parentPath, response.data)
    await setCurrentNode(response.data)
  }

  const setCurrentNode = async (node: FsNode): Promise<void> => {
    const normalizedNode = normalizeFsNode(node)
    if (isMarkdownNode(normalizedNode)) {
      if (currentFileNode.value?.path !== normalizedNode.path) {
        try {
          await saveCurrentFileIfDirty()
        } catch (_) {
          return
        }
      }
      closeImagePreview()
      void loadCurrentFile(normalizedNode)
    } else if (isPreviewableImageNode(normalizedNode)) {
      currentNode.value = normalizedNode
      openImagePreview(normalizedNode)
    } else if (node.type === 'dir') {
      closeImagePreview()
      currentNode.value = normalizedNode
    } else {
      closeImagePreview()
      currentNode.value = normalizedNode
      toastStore.pushNotice('warning', `WARNING: The selected object cannot be opened.`)
    }
  }

  const clearCurrentNode = () => {
    currentNode.value = null
    closeImagePreview()
  }

  const uploadFile = async (
    file: File,
    uploadPercent: Ref<number, number>,
    destinationPath: string = currentParentPath.value,
  ): Promise<string> => {
    const parentPath = normalizeNodePath(destinationPath)
    const response = await actionLedger.runAction('upload-file', async () => {
      return await uploadFileApi(parentPath, file, (percent) => {
        uploadPercent.value = percent
      })
    })
    if (response.data.node) {
      await fileTree.ensureDirectoryVisible(parentPath)
      upsertNode(parentPath, response.data.node)
    }
    toastStore.pushNotice('info', `File upload successfully.`)
    return response.data.filename
  }

  const saveCurrentFile = async (options: { silent?: boolean } = {}): Promise<void> => {
    if (!isInitialized) {
      toastStore.pushNotice('warning', 'The home page cannot be changed.')
      return
    }
    const savedPath = currentFile.value.path
    const response = await actionLedger.runAction('save-current-file', async () => {
      const path = savedPath
      const content = currentFile.value.content
      const saveResponse = await saveNoteApi(path, content)
      if (currentFile.value.path === path) {
        lastSavedContent.value = content
      }
      return saveResponse
    })
    if (currentFile.value.path === savedPath) {
      currentFile.value.meta = response.data
    }
    if (!options.silent) {
      toastStore.pushNotice('info', 'The note has been saved.')
    }
  } 

  const saveCurrentFileIfDirty = async (): Promise<void> => {
    if (!isCurrentFileDirty.value) {
      return
    }

    await saveCurrentFile({ silent: true })
  }

  const saveCurrentFileBeforeUnload = () => {
    if (!isCurrentFileDirty.value) {
      return
    }

    saveNoteKeepalive(currentFile.value.path, currentFile.value.content)
    lastSavedContent.value = currentFile.value.content
  }

  const deletedItem = async (): Promise<void> => {
    if (currentNode.value === null) {
      toastStore.pushNotice('warning', 'No file / folder selected.')
      return
    }

    const targetNode = currentNode.value
    const targetPath = normalizeNodePath(targetNode.path)
    const response = await actionLedger.runAction('delete-item', async () => {
      return await removeItemApi(targetPath)
    })
    const nodeType = targetNode.type === 'file' ? 'File' : 'Folder'
    if (response.status !== 200) {
      return
    }

    if (isPathInside(currentFile.value.path, targetPath)) {
      resetCurrentFileState()
    }

    removeNodeFromDirectoryTree(targetPath)

    if (currentNode.value && isPathInside(currentNode.value.path, targetPath)) {
      currentNode.value = currentFileNode.value && !isPathInside(currentFileNode.value.path, targetPath)
        ? currentFileNode.value
        : null
    }

    if (currentFileNode.value && isPathInside(currentFileNode.value.path, targetPath)) {
      currentFileNode.value = null
    }

    toastStore.pushNotice('info', `${nodeType} has been deleted.`)
  }

  const renameNode = async (node: FsNode, newName: string): Promise<void> => {
    const normalizedOldPath = normalizeNodePath(node.path)
    const normalizedNewPath = buildRenamedPath(node, newName)
    await actionLedger.runAction(`rename:${normalizedOldPath}`, async () => {
      return await renameItemApi(normalizedOldPath, newName)
    })
    remapDirectoryTreePathPrefix(normalizedOldPath, normalizedNewPath, newName)
    toastStore.pushNotice('info', "Rename successful!")
  }

  return { 
    rootNodes,
    welcomeNoteState,
    currentNode,
    currentFile,
    currentPreviewImageNode,
    currentPreviewImageUrl,
    currentFileStatus,
    currentFileDisplayName,
    currentPath: currentParentPath,
    currentFileParentPath,
    currentPathLabel,
    canEditCurrentFile,
    isCurrentFileDirty,
    isCreatePending: (type: 'file' | 'dir') => actionLedger.isActionPending(type === 'file' ? 'create-file' : 'create-dir'),
    isDeletePending: () => actionLedger.isActionPending('delete-item'),
    isUploadPending: () => actionLedger.isActionPending('upload-file'),
    isSavePending: () => actionLedger.isActionPending('save-current-file'),
    currentRenderedFile,
    ensureWelcomeNoteLoaded,
    loadDirectory,
    getDirectoryChildren,
    getDirectoryLoadState,
    isDirectoryExpanded,
    expandDirectory,
    collapseDirectory,
    toggleDirectory,
    loadCurrentFile,
    addNewNode,
    setCurrentNode,
    clearCurrentNode,
    openImagePreview,
    closeImagePreview,
    uploadFile,
    saveCurrentFile,
    saveCurrentFileIfDirty,
    saveCurrentFileBeforeUnload,
    deletedItem,
    renameNode,
  }
});
