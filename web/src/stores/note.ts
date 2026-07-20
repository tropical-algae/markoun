import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'
import { useActionLedger } from '@/composables/useActionLedger'
import type { FsNode } from '@/types/file-system'
import { useToastStore } from '@/stores/toast'
import {
  getMediaPath,
  getParentPath,
  isPathInside,
  normalizeNodePath,
  ROOT_DIRECTORY_PATH,
} from '@/utils/file-system'
import {
  buildRenamedPath,
  isMarkdownNode,
  isPreviewableImageNode,
  normalizeFsNode,
  remapOptionalFsNodePathPrefix,
} from '@/utils/file-node'
import {
  getFileContentApi,
  createNoteApi,
  uploadFileApi,
  saveNoteApi,
  saveNoteKeepalive,
} from '@/api/file'
import { moveItemApi, removeItemApi, renameItemApi } from '@/api/item'
import { createDirApi } from '@/api/dir'
import { getWelcomeNoteApi } from '@/api/system'
import { useFileTreeState } from '@/stores/note/file-tree-state'
import { useCurrentFileState } from '@/stores/note/current-file-state'

export const useNodeStore = defineStore('note', () => {
  const fileTree = useFileTreeState()
  const fileState = useCurrentFileState()
  const currentNode = ref<FsNode | null>(null)
  const currentPreviewImageNode = ref<FsNode | null>(null)
  const currentParentPath = computed(() => {
    return getParentPath(currentNode.value ?? fileState.currentFileNode.value)
  })
  const currentFileParentPath = computed(() => {
    return getParentPath(fileState.currentFileNode.value ?? fileState.currentFile.value.path)
  })
  const currentPathLabel = computed(() => {
    return currentParentPath.value === ROOT_DIRECTORY_PATH ? '/' : currentParentPath.value
  })
  const rootNodes = fileTree.rootNodes
  const currentPreviewImageUrl = computed(() => {
    return currentPreviewImageNode.value
      ? getMediaPath(ROOT_DIRECTORY_PATH, currentPreviewImageNode.value.path)
      : ''
  })

  const toastStore = useToastStore()
  const actionLedger = useActionLedger()
  let currentSelectionId = 0
  let pendingFileSwitchSave: Promise<void> | null = null
  const {
    loadDirectory,
    getDirectoryChildren,
    getDirectoryLoadState,
    isDirectoryExpanded,
    expandDirectory,
    collapseDirectory,
    toggleDirectory,
  } = fileTree

  const remapDirectoryTreePathPrefix = (oldPath: string, newPath: string, exactName: string) => {
    fileTree.remapDirectoryTreePathPrefix(oldPath, newPath, exactName)

    currentNode.value = remapOptionalFsNodePathPrefix(currentNode.value, oldPath, newPath, exactName)
    fileState.remapCurrentFileNodePathPrefix(oldPath, newPath, exactName)
    currentPreviewImageNode.value = remapOptionalFsNodePathPrefix(
      currentPreviewImageNode.value,
      oldPath,
      newPath,
      exactName,
    )

    fileState.remapCurrentFilePathPrefix(oldPath, newPath, exactName)
  }

  const removeNodeFromDirectoryTree = (path: string) => {
    const normalizedPath = normalizeNodePath(path)
    fileTree.removeNodeFromDirectoryTree(normalizedPath)

    if (
      currentPreviewImageNode.value
      && isPathInside(currentPreviewImageNode.value.path, normalizedPath)
    ) {
      currentPreviewImageNode.value = null
    }
  }

  const ensureWelcomeNoteLoaded = async (): Promise<string> => {
    if (fileState.welcomeNoteState.value === 'ready') {
      return fileState.welcomeNoteContent.value
    }

    fileState.beginWelcomeNoteLoad()

    try {
      const response = await getWelcomeNoteApi()
      fileState.completeWelcomeNoteLoad(response.data)
      return fileState.welcomeNoteContent.value
    } catch (error) {
      fileState.failWelcomeNoteLoad()
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
    fileState.syncCurrentFileNode(normalizedNode)
  }

  const loadCurrentFile = async (node: FsNode) => {
    if (!isMarkdownNode(node)) {
      return
    }

    const normalizedNode = normalizeFsNode(node)
    if (fileState.currentFileNode.value?.path === normalizedNode.path) {
      if (fileState.currentFileStatus.value === 'ready') {
        currentNode.value = normalizedNode
        return
      }
      if (fileState.currentFileStatus.value === 'loading') {
        currentNode.value = normalizedNode
        return
      }
    }

    currentNode.value = normalizedNode
    const requestId = fileState.beginFileLoad(normalizedNode)

    try {
      const response = await getFileContentApi(normalizedNode.path)
      fileState.completeFileLoad(requestId, normalizedNode, response.data)
    } catch (error) {
      fileState.failFileLoad(requestId, normalizedNode)
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
    const selectionId = ++currentSelectionId
    const normalizedNode = normalizeFsNode(node)
    if (isMarkdownNode(normalizedNode)) {
      if (fileState.currentFileNode.value?.path !== normalizedNode.path) {
        const sourceNode = fileState.currentFileNode.value
        const sourcePath = sourceNode?.path ?? ''
        const shouldSave = fileState.isCurrentFileDirty.value

        currentNode.value = normalizedNode
        closeImagePreview()
        fileState.beginFileSwitch()

        try {
          if (shouldSave || pendingFileSwitchSave) {
            await saveCurrentFileForSwitch()
          }
        } catch (_) {
          fileState.cancelFileSwitch(sourcePath)
          if (selectionId === currentSelectionId) {
            currentNode.value = sourceNode
          }
          return
        }

        if (selectionId !== currentSelectionId) {
          fileState.cancelFileSwitch(sourcePath)
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
    if (!fileState.isCurrentFileInitialized.value) {
      toastStore.pushNotice('warning', 'The home page cannot be changed.')
      return
    }
    const savedPath = fileState.currentFile.value.path
    const savedContent = fileState.currentFile.value.content
    const response = await actionLedger.runAction('save-current-file', async () => {
      const saveResponse = await saveNoteApi(savedPath, savedContent)
      if (fileState.currentFile.value.path === savedPath) {
        fileState.markSavedContent(savedContent)
      }
      return saveResponse
    })
    if (fileState.currentFile.value.path === savedPath) {
      fileState.updateCurrentFileMeta(response.data)
    }
    if (!options.silent) {
      toastStore.pushNotice('info', 'The note has been saved.')
    }
  }

  const saveCurrentFileForSwitch = (): Promise<void> => {
    if (pendingFileSwitchSave) {
      return pendingFileSwitchSave
    }

    const operation = saveCurrentFile({ silent: false })
    pendingFileSwitchSave = operation

    const clearPendingSave = () => {
      if (pendingFileSwitchSave === operation) {
        pendingFileSwitchSave = null
      }
    }
    void operation.then(clearPendingSave, clearPendingSave)
    return operation
  }

  const saveCurrentFileIfDirty = async (): Promise<void> => {
    if (!fileState.isCurrentFileDirty.value) {
      return
    }
    await saveCurrentFile({ silent: false })
  }

  const saveCurrentFileBeforeUnload = () => {
    if (!fileState.isCurrentFileDirty.value) {
      return
    }

    saveNoteKeepalive(fileState.currentFile.value.path, fileState.currentFile.value.content)
    fileState.markSavedContent(fileState.currentFile.value.content)
  }

  const deleteCurrentNode = async (): Promise<void> => {
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

    if (isPathInside(fileState.currentFile.value.path, targetPath)) {
      fileState.resetCurrentFileState()
    }

    removeNodeFromDirectoryTree(targetPath)

    if (currentNode.value && isPathInside(currentNode.value.path, targetPath)) {
      currentNode.value = fileState.currentFileNode.value
        && !isPathInside(fileState.currentFileNode.value.path, targetPath)
        ? fileState.currentFileNode.value
        : null
    }

    if (
      fileState.currentFileNode.value
      && isPathInside(fileState.currentFileNode.value.path, targetPath)
    ) {
      fileState.clearCurrentFileNode()
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

  const moveNode = async (node: FsNode, targetDir: string): Promise<void> => {
    const normalizedNode = normalizeFsNode(node)
    const normalizedOldPath = normalizedNode.path
    const normalizedTargetDir = normalizeNodePath(targetDir)
    const currentParent = getParentPath(normalizedOldPath)

    if (currentParent === normalizedTargetDir) {
      return
    }

    if (
      fileState.currentFileNode.value
      && isPathInside(fileState.currentFileNode.value.path, normalizedOldPath)
    ) {
      await saveCurrentFileIfDirty()
    }

    const response = await actionLedger.runAction(`move:${normalizedOldPath}`, async () => {
      return await moveItemApi(normalizedOldPath, normalizedTargetDir)
    })
    const movedNode = fileTree.moveNodeToDirectory(
      normalizedOldPath,
      normalizedTargetDir,
      response.data,
    )

    currentNode.value = remapOptionalFsNodePathPrefix(
      currentNode.value,
      normalizedOldPath,
      movedNode.path,
      movedNode.name,
    )
    fileState.remapCurrentFileNodePathPrefix(normalizedOldPath, movedNode.path, movedNode.name)
    currentPreviewImageNode.value = remapOptionalFsNodePathPrefix(
      currentPreviewImageNode.value,
      normalizedOldPath,
      movedNode.path,
      movedNode.name,
    )

    fileState.remapCurrentFilePathPrefix(normalizedOldPath, movedNode.path, movedNode.name)

    await fileTree.ensureDirectoryVisible(normalizedTargetDir)
    toastStore.pushNotice('info', "Move successful!")
  }

  return { 
    rootNodes,
    welcomeNoteState: fileState.welcomeNoteState,
    currentNode,
    currentFile: fileState.currentFile,
    currentPreviewImageNode,
    currentPreviewImageUrl,
    currentFileStatus: fileState.currentFileStatus,
    currentFileDisplayName: fileState.currentFileDisplayName,
    currentPath: currentParentPath,
    currentFileParentPath,
    currentPathLabel,
    canEditCurrentFile: fileState.canEditCurrentFile,
    isCurrentFileDirty: fileState.isCurrentFileDirty,
    isCreatePending: (type: 'file' | 'dir') => actionLedger.isActionPending(type === 'file' ? 'create-file' : 'create-dir'),
    isDeletePending: () => actionLedger.isActionPending('delete-item'),
    isUploadPending: () => actionLedger.isActionPending('upload-file'),
    isSavePending: () => actionLedger.isActionPending('save-current-file'),
    currentRenderedFile: fileState.currentRenderedFile,
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
    deleteCurrentNode,
    renameNode,
    moveNode,
  }
})
