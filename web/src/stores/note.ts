import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";
import { useActionLedger } from "@/composables/useActionLedger";
import type { DirectoryLoadState, FileDetail, FsNode } from "@/types/file-system";
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
  sortFsNodes,
} from "@/utils/file-node";
import { renderMarkdownFile } from "@/utils/markdown";
import { getFileContentApi, createNoteApi, uploadFileApi, saveNoteApi } from "@/api/file";
import { getDirectoryChildrenApi, removeItemApi, renameItemApi } from "@/api/item";
import { createDirApi } from "@/api/dir";
import { getWelcomeNoteApi } from "@/api/system";

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

  const directoryChildrenByPath = ref<Record<string, FsNode[]>>({})
  const directoryLoadStateByPath = ref<Record<string, DirectoryLoadState>>({})
  const expandedDirPaths = ref<Record<string, boolean>>({})
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
  const rootNodes = computed(() => directoryChildrenByPath.value[ROOT_DIRECTORY_PATH] || [])
  const currentFileDisplayName = computed(() => currentFileNode.value?.name || currentFile.value.name)
  const canEditCurrentFile = computed(() => currentFileStatus.value === 'ready' && Boolean(currentFileNode.value))
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
  const directoryRequests = new Map<string, Promise<FsNode[]>>()

  const toastStore = useToastStore()
  const actionLedger = useActionLedger()

  const replaceDirectoryChildren = (path: string, children: FsNode[]): FsNode[] => {
    const normalizedPath = normalizeNodePath(path)
    const normalizedChildren = sortFsNodes(children.map((node) => normalizeFsNode(node)))
    directoryChildrenByPath.value = {
      ...directoryChildrenByPath.value,
      [normalizedPath]: normalizedChildren,
    }
    return normalizedChildren
  }

  const getDirectoryChildren = (path: string): FsNode[] => {
    return directoryChildrenByPath.value[normalizeNodePath(path)] || []
  }

  const getDirectoryLoadState = (path: string): DirectoryLoadState => {
    return directoryLoadStateByPath.value[normalizeNodePath(path)] || 'idle'
  }

  const isDirectoryExpanded = (path: string): boolean => {
    const normalizedPath = normalizeNodePath(path)
    return normalizedPath === ROOT_DIRECTORY_PATH || Boolean(expandedDirPaths.value[normalizedPath])
  }

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
    const nextDirectoryChildrenByPath: Record<string, FsNode[]> = {}
    for (const [directoryPath, children] of Object.entries(directoryChildrenByPath.value)) {
      nextDirectoryChildrenByPath[replacePathPrefix(directoryPath, oldPath, newPath)] = sortFsNodes(
        children.map((child) => remapReferencedNode(child, oldPath, newPath, exactName) ?? child),
      )
    }
    directoryChildrenByPath.value = nextDirectoryChildrenByPath

    const nextDirectoryLoadStateByPath: Record<string, DirectoryLoadState> = {}
    for (const [directoryPath, state] of Object.entries(directoryLoadStateByPath.value)) {
      nextDirectoryLoadStateByPath[replacePathPrefix(directoryPath, oldPath, newPath)] = state
    }
    directoryLoadStateByPath.value = nextDirectoryLoadStateByPath

    const nextExpandedDirPaths: Record<string, boolean> = {}
    for (const [directoryPath, expanded] of Object.entries(expandedDirPaths.value)) {
      nextExpandedDirPaths[replacePathPrefix(directoryPath, oldPath, newPath)] = expanded
    }
    expandedDirPaths.value = nextExpandedDirPaths

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

    const nextDirectoryChildrenByPath: Record<string, FsNode[]> = {}
    for (const [directoryPath, children] of Object.entries(directoryChildrenByPath.value)) {
      if (isPathInside(directoryPath, normalizedPath)) {
        continue
      }

      nextDirectoryChildrenByPath[directoryPath] = children.filter((child) => {
        return !isPathInside(child.path, normalizedPath)
      })
    }
    directoryChildrenByPath.value = nextDirectoryChildrenByPath

    const nextDirectoryLoadStateByPath: Record<string, DirectoryLoadState> = {}
    for (const [directoryPath, state] of Object.entries(directoryLoadStateByPath.value)) {
      if (!isPathInside(directoryPath, normalizedPath)) {
        nextDirectoryLoadStateByPath[directoryPath] = state
      }
    }
    directoryLoadStateByPath.value = nextDirectoryLoadStateByPath

    const nextExpandedDirPaths: Record<string, boolean> = {}
    for (const [directoryPath, expanded] of Object.entries(expandedDirPaths.value)) {
      if (!isPathInside(directoryPath, normalizedPath)) {
        nextExpandedDirPaths[directoryPath] = expanded
      }
    }
    expandedDirPaths.value = nextExpandedDirPaths

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

  const loadDirectory = async (
    path: string = ROOT_DIRECTORY_PATH,
    force: boolean = false,
  ): Promise<FsNode[]> => {
    const normalizedPath = normalizeNodePath(path)
    if (!force && getDirectoryLoadState(normalizedPath) === 'loaded') {
      return getDirectoryChildren(normalizedPath)
    }

    if (!force) {
      const pendingRequest = directoryRequests.get(normalizedPath)
      if (pendingRequest) {
        return pendingRequest
      }
    }

    directoryLoadStateByPath.value = {
      ...directoryLoadStateByPath.value,
      [normalizedPath]: 'loading',
    }

    const request = getDirectoryChildrenApi(normalizedPath)
      .then((response) => {
        const responsePath = normalizeNodePath(response.data.path)
        const children = replaceDirectoryChildren(responsePath, response.data.children)
        directoryLoadStateByPath.value = {
          ...directoryLoadStateByPath.value,
          [responsePath]: 'loaded',
        }
        return children
      })
      .catch((error) => {
        directoryLoadStateByPath.value = {
          ...directoryLoadStateByPath.value,
          [normalizedPath]: 'error',
        }
        throw error
      })
      .finally(() => {
        directoryRequests.delete(normalizedPath)
      })

    directoryRequests.set(normalizedPath, request)
    return request
  }

  const expandDirectory = async (path: string): Promise<FsNode[]> => {
    const normalizedPath = normalizeNodePath(path)
    if (normalizedPath !== ROOT_DIRECTORY_PATH) {
      expandedDirPaths.value = {
        ...expandedDirPaths.value,
        [normalizedPath]: true,
      }
    }

    return await loadDirectory(normalizedPath)
  }

  const collapseDirectory = (path: string) => {
    const normalizedPath = normalizeNodePath(path)
    if (normalizedPath === ROOT_DIRECTORY_PATH) {
      return
    }

    const nextExpandedDirPaths = { ...expandedDirPaths.value }
    delete nextExpandedDirPaths[normalizedPath]
    expandedDirPaths.value = nextExpandedDirPaths
  }

  const toggleDirectory = async (node: FsNode) => {
    if (node.type !== 'dir') {
      return
    }

    if (isDirectoryExpanded(node.path)) {
      collapseDirectory(node.path)
      return
    }

    await expandDirectory(node.path)
  }

  const ensureDirectoryVisible = async (path: string) => {
    const normalizedPath = normalizeNodePath(path)
    if (normalizedPath !== ROOT_DIRECTORY_PATH) {
      expandedDirPaths.value = {
        ...expandedDirPaths.value,
        [normalizedPath]: true,
      }
    }
    await loadDirectory(normalizedPath)
  }

  const openImagePreview = (node: FsNode) => {
    currentPreviewImageNode.value = normalizeFsNode(node)
  }

  const closeImagePreview = () => {
    currentPreviewImageNode.value = null
  }

  const upsertNode = (parentPath: string, node: FsNode) => {
    const normalizedParentPath = normalizeNodePath(parentPath)
    const normalizedNode = normalizeFsNode(node)
    const nextChildren = getDirectoryChildren(normalizedParentPath).filter(
      (child) => child.path !== normalizedNode.path
    )
    nextChildren.push(normalizedNode)
    replaceDirectoryChildren(normalizedParentPath, nextChildren)

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

    await ensureDirectoryVisible(parentPath)
    upsertNode(parentPath, response.data)
    setCurrentNode(response.data)
  }

  const setCurrentNode = (node: FsNode) => {
    const normalizedNode = normalizeFsNode(node)
    if (isMarkdownNode(normalizedNode)) {
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
      await ensureDirectoryVisible(parentPath)
      upsertNode(parentPath, response.data.node)
    }
    toastStore.pushNotice('info', `File upload successfully.`)
    return response.data.filename
  }

  const saveCurrentFile = async (): Promise<void> => {
    if (!isInitialized) {
      toastStore.pushNotice('warning', 'The home page cannot be changed.')
      return
    }
    const response = await actionLedger.runAction('save-current-file', async () => {
      return await saveNoteApi(currentFile.value.path, currentFile.value.content)
    })
    currentFile.value.meta = response.data
    toastStore.pushNotice('info', 'The note has been saved.')
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
    deletedItem,
    renameNode,
  }
});
