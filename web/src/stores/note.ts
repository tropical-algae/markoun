import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'
import { useActionLedger } from '@/composables/useActionLedger'
import type { FsNode, PastedImageResponse, SelectedItem, UploadResponse } from '@/types/file-system'
import { useToastStore } from '@/stores/toast'
import {
  getMediaPath,
  getParentPath,
  isPathInside,
  normalizeNodePath,
  ROOT_DIRECTORY_PATH,
  replacePathPrefix,
} from '@/utils/file-system'
import {
  buildRenamedPath,
  isPreviewableImageNode,
  normalizeFsNode,
  remapOptionalFsNodePathPrefix,
} from '@/utils/file-node'
import {
  getFileContentApi,
  createNoteApi,
  uploadPastedImageApi,
  uploadFileApi,
  saveNoteApi,
  saveNoteKeepalive,
} from '@/api/file'
import { deleteHistoryRevisionApi, getHistoryRevisionApi } from '@/api/history'
import { moveItemApi, removeItemApi, renameItemApi } from '@/api/item'
import { createDirApi } from '@/api/dir'
import { getWelcomeNoteApi } from '@/api/system'
import { useFileTreeState } from '@/stores/note/file-tree-state'
import { useCurrentFileState, type FileContext } from '@/stores/note/current-file-state'
import { useHistoryState } from '@/stores/note/history-state'
import { normalizeFilePath } from '@/utils/file-navigation'
import { normalizeRequestError } from '@/utils/request'

export const useNodeStore = defineStore('note', () => {
  const fileTree = useFileTreeState()
  const fileState = useCurrentFileState()
  const historyState = useHistoryState()
  const selectedItem = ref<SelectedItem | null>(null)
  const currentPreviewImageNode = ref<FsNode | null>(null)
  const currentParentPath = computed(() => {
    const item = selectedItem.value
    return item?.type === 'dir'
      ? item.path
      : getParentPath(item?.path ?? fileState.currentFile.value.path)
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
  let fileRequest: AbortController | null = null
  let pendingSave: Promise<void> | null = null
  let welcomeRequest: Promise<string> | null = null
  const {
    loadDirectory,
    getCachedNode,
    getDirectoryChildren,
    getDirectoryLoadState,
    isDirectoryExpanded,
    canExpandDirectory,
    getDirectoryRenderState,
    retryDirectory,
    expandDirectory,
    collapseDirectory,
    toggleDirectory,
  } = fileTree

  const remapWorkspacePaths = (oldPath: string, newPath: string, exactName: string) => {
    if (selectedItem.value) {
      selectedItem.value = {
        ...selectedItem.value,
        path: replacePathPrefix(selectedItem.value.path, oldPath, newPath),
      }
    }
    currentPreviewImageNode.value = remapOptionalFsNodePathPrefix(
      currentPreviewImageNode.value,
      oldPath,
      newPath,
      exactName,
    )

    fileState.remapCurrentFilePathPrefix(oldPath, newPath, exactName)
    historyState.remapHistoryPath(oldPath, newPath)
  }

  const removeNodeState = (path: string) => {
    const normalizedPath = normalizeNodePath(path)
    fileTree.removeSubtree(normalizedPath)

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

    if (welcomeRequest) return welcomeRequest
    fileState.beginWelcomeNoteLoad()
    welcomeRequest = getWelcomeNoteApi().then((response) => {
      fileState.completeWelcomeNoteLoad(response.data)
      return fileState.welcomeNoteContent.value
    }).catch((error) => {
      fileState.failWelcomeNoteLoad()
      throw error
    }).finally(() => { welcomeRequest = null })
    return welcomeRequest
  }

  const openImagePreview = (node: FsNode) => {
    currentPreviewImageNode.value = normalizeFsNode(node)
  }

  const closeImagePreview = () => {
    currentPreviewImageNode.value = null
  }

  const loadFile = async (filePath: string, force = false): Promise<boolean> => {
    const path = normalizeFilePath(filePath)
    if (!force && fileState.currentFile.value.path === path
      && ['ready', 'loading'].includes(fileState.currentFileStatus.value)) {
      return true
    }
    fileRequest?.abort()
    const controller = new AbortController()
    fileRequest = controller
    historyState.beginHistoryInitialization(path)
    const read = fileState.beginFileLoad(path)

    try {
      const response = await getFileContentApi(path, controller.signal)
      const completed = fileState.completeFileLoad(read, response.data)
      if (completed) {
        historyState.initializeHistory(
          path,
          response.data.history_enabled,
          response.data.default_revision_id,
        )
      }
      return completed
    } catch (error) {
      if (controller.signal.aborted || !fileState.failFileLoad(read)) return false
      historyState.failHistoryInitialization(path)
      if (normalizeRequestError(error).status === 404) fileTree.removeSubtree(path)
      throw error
    } finally {
      if (fileRequest === controller) fileRequest = null
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

    fileTree.insertNode(parentPath, response.data)
    void fileTree.expandDirectory(parentPath).catch(() => null)
    return response.data
  }

  const selectItem = (node: FsNode): void => {
    const normalizedNode = normalizeFsNode(node)
    selectedItem.value = { path: normalizedNode.path, type: normalizedNode.type }
    if (isPreviewableImageNode(normalizedNode)) {
      openImagePreview(normalizedNode)
    } else {
      closeImagePreview()
    }
  }

  const clearSelection = () => {
    selectedItem.value = null
    closeImagePreview()
  }

  const showWelcome = () => {
    fileRequest?.abort()
    fileRequest = null
    fileState.resetCurrentFileState()
    historyState.resetHistoryState()
    clearSelection()
  }

  const resetWorkspaceState = () => {
    showWelcome()
    pendingSave = null
    fileTree.resetFileTree()
  }

  const uploadFile = async (
    file: File,
    uploadPercent: Ref<number, number>,
    destinationPath: string = currentParentPath.value,
  ): Promise<UploadResponse> => {
    const parentPath = normalizeNodePath(destinationPath)
    const response = await actionLedger.runAction('upload-file', async () => {
      return await uploadFileApi(parentPath, file, (percent) => {
        uploadPercent.value = percent
      })
    })
    if (response.data.node) {
      fileTree.insertNode(parentPath, response.data.node)
      void fileTree.expandDirectory(parentPath).catch(() => null)
    }
    toastStore.pushNotice('info', `File upload successfully.`)
    return response.data
  }

  const uploadPastedImage = async (
    file: File,
    notePath: string,
    uploadPercent: Ref<number, number>,
  ): Promise<PastedImageResponse> => {
    const response = await actionLedger.runAction('upload-file', async () => {
      return await uploadPastedImageApi(notePath, file, (percent) => {
        uploadPercent.value = percent
      })
    })

    const createdDirectory = response.data.created_directory
    if (createdDirectory) {
      const directoryParent = getParentPath(createdDirectory.path)
      fileTree.insertNode(directoryParent, createdDirectory)
    }

    const uploadedNode = response.data.node
    const uploadParent = getParentPath(response.data.path)
    if (uploadedNode) {
      fileTree.insertNode(uploadParent, uploadedNode)
    }

    toastStore.pushNotice('info', `Image upload successfully.`)
    return response.data
  }

  const performSave = async (
    options: { silent?: boolean; refreshHistory?: boolean } = {},
  ): Promise<void> => {
    const context = fileState.captureFileContext()
    if (!context || !fileState.canEditCurrentFile.value) {
      toastStore.pushNotice('warning', 'The home page cannot be changed.')
      return
    }
    const savedPath = context.path
    const savedContent = context.file.content
    const response = await actionLedger.runAction('save-current-file', async () => {
      const saveResponse = await saveNoteApi(
        savedPath,
        savedContent,
        historyState.baseRevisionId.value,
      )
      if (fileState.isCurrentFileContext(context)) {
        fileState.markSavedContent(savedContent)
        historyState.applySaveResult(
          savedPath,
          saveResponse.data.history_enabled,
          saveResponse.data.revision_id,
          saveResponse.data.default_revision_id,
        )
      }
      return saveResponse
    })
    if (fileState.isCurrentFileContext(context)) {
      const meta = Object.fromEntries(
        Object.entries(response.data).filter(([key, value]) => {
          return ![
            'history_enabled',
            'revision_id',
            'default_revision_id',
          ].includes(key) && typeof value === 'string'
        }),
      ) as Record<string, string>
      fileState.updateCurrentFileMeta(meta)
      if (options.refreshHistory !== false) {
        void historyState.refreshHistoryTreeIfRequested(savedPath).catch(() => null)
      }
    }
    if (!options.silent) {
      toastStore.pushNotice('info', 'The note has been saved.')
    }
  }

  const saveCurrentFile = (
    options: { silent?: boolean; refreshHistory?: boolean } = {},
  ): Promise<void> => {
    if (pendingSave) return pendingSave
    const operation = performSave(options)
    pendingSave = operation
    const clear = () => { if (pendingSave === operation) pendingSave = null }
    void operation.then(clear, clear)
    return operation
  }

  const saveCurrentFileIfDirty = async (
    options: { refreshHistory?: boolean } = {},
  ): Promise<void> => {
    const context = fileState.captureFileContext()
    if (!context) return
    if (pendingSave) await pendingSave
    if (!fileState.isCurrentFileContext(context) || !fileState.isCurrentFileDirty.value) {
      return
    }
    await saveCurrentFile({ ...options, silent: false })
    if (fileState.isCurrentFileContext(context) && fileState.isCurrentFileDirty.value) {
      toastStore.pushNotice('warning', 'The note changed while saving. Please try again.')
      throw new Error('The note changed while saving')
    }
  }

  const saveCurrentFileBeforeUnload = () => {
    if (!fileState.isCurrentFileDirty.value) {
      return
    }

    saveNoteKeepalive(
      fileState.currentFile.value.path,
      fileState.currentFile.value.content,
      historyState.baseRevisionId.value,
    )
    fileState.markSavedContent(fileState.currentFile.value.content)
  }

  const loadHistoryTree = async (): Promise<void> => {
    const path = fileState.currentFile.value.path
    if (path) {
      await historyState.loadHistoryTree(path)
    }
  }

  const loadRevisionContent = async (
    context: FileContext,
    revisionId: string,
  ): Promise<void> => {
    const read = fileState.beginRevisionLoad(context)
    if (!read) return
    const previousContent = context.file.content
    historyState.beginRevisionLoad(revisionId)
    try {
      const response = await getHistoryRevisionApi(context.path, revisionId)
      if (fileState.completeRevisionLoad(read, response.data.content)) {
        historyState.completeRevisionLoad(revisionId)
      }
    } catch (error) {
      if (fileState.completeRevisionLoad(read, previousContent)) {
        historyState.failRevisionLoad()
        throw error
      }
    }
  }

  const selectHistoryRevision = async (revisionId: string): Promise<void> => {
    const context = fileState.captureFileContext()
    if (
      actionLedger.isActionPending('load-history-revision')
      || actionLedger.isActionPending('delete-history-revision')
      || historyState.pendingRevisionId.value
      || historyState.viewedRevisionId.value === revisionId
      || !context
    ) {
      return
    }

    await actionLedger.runAction('load-history-revision', async () => {
      await saveCurrentFileIfDirty()
      await loadRevisionContent(context, revisionId)
    })
  }

  const prepareHistoryRevisionDelete = async (): Promise<void> => {
    const context = fileState.captureFileContext()
    if (!context) return
    await saveCurrentFileIfDirty({ refreshHistory: false })
    if (fileState.isCurrentFileContext(context)) {
      await historyState.loadHistoryTree(context.path, true)
    }
  }

  const deleteHistoryRevision = async (revisionId: string): Promise<void> => {
    const context = fileState.captureFileContext()
    if (
      !context
      || actionLedger.isActionPending('delete-history-revision')
      || actionLedger.isActionPending('load-history-revision')
    ) {
      return
    }

    await actionLedger.runAction('delete-history-revision', async () => {
      await saveCurrentFileIfDirty()
      if (!fileState.isCurrentFileContext(context)) return
      const response = await deleteHistoryRevisionApi(context.path, revisionId)
      toastStore.pushNotice('info', 'The revision has been deleted.')
      if (!fileState.isCurrentFileContext(context)) return
      historyState.replaceHistoryTree(context.path, response.data)

      const viewedRevisionStillExists = response.data.nodes.some(
        (item) => item.id === historyState.viewedRevisionId.value,
      )
      if (viewedRevisionStillExists) {
        return
      }

      if (response.data.default_revision_id) {
        await loadRevisionContent(context, response.data.default_revision_id)
        return
      }

      await loadFile(context.path, true)
    })
  }

  const deleteNode = async (targetNode: SelectedItem): Promise<void> => {
    const targetPath = normalizeNodePath(targetNode.path)
    const response = await actionLedger.runAction('delete-item', async () => {
      return await removeItemApi(targetPath)
    })
    const nodeType = targetNode.type === 'file' ? 'File' : 'Folder'
    if (response.status !== 200) {
      return
    }

    if (isPathInside(fileState.currentFile.value.path, targetPath)) {
      fileRequest?.abort()
      fileState.resetCurrentFileState()
      historyState.resetHistoryState()
    }

    removeNodeState(targetPath)

    if (selectedItem.value && isPathInside(selectedItem.value.path, targetPath)) {
      const path = fileState.currentFile.value.path
      selectedItem.value = path ? { path, type: 'file' } : null
    }

    toastStore.pushNotice('info', `${nodeType} has been deleted.`)
  }

  const renameNode = async (node: FsNode, newName: string): Promise<string> => {
    const normalizedOldPath = normalizeNodePath(node.path)
    const normalizedNewPath = buildRenamedPath(node, newName)
    if (isPathInside(fileState.currentFile.value.path, normalizedOldPath)) {
      await saveCurrentFileIfDirty()
    }
    await actionLedger.runAction(`rename:${normalizedOldPath}`, async () => {
      return await renameItemApi(normalizedOldPath, newName)
    })
    fileTree.renameSubtree(normalizedOldPath, normalizedNewPath, newName)
    remapWorkspacePaths(normalizedOldPath, normalizedNewPath, newName)
    toastStore.pushNotice('info', "Rename successful!")
    return normalizedNewPath
  }

  const moveNode = async (node: FsNode, targetDir: string): Promise<string> => {
    const normalizedNode = normalizeFsNode(node)
    const normalizedOldPath = normalizedNode.path
    const normalizedTargetDir = normalizeNodePath(targetDir)
    const currentParent = getParentPath(normalizedOldPath)

    if (currentParent === normalizedTargetDir) {
      return normalizedOldPath
    }

    if (isPathInside(fileState.currentFile.value.path, normalizedOldPath)) {
      await saveCurrentFileIfDirty()
    }

    const response = await actionLedger.runAction(`move:${normalizedOldPath}`, async () => {
      return await moveItemApi(normalizedOldPath, normalizedTargetDir)
    })
    const movedNode = fileTree.moveSubtree(
      normalizedOldPath,
      normalizedTargetDir,
      response.data,
    )

    remapWorkspacePaths(normalizedOldPath, movedNode.path, movedNode.name)

    void fileTree.expandDirectory(normalizedTargetDir).catch(() => null)
    toastStore.pushNotice('info', "Move successful!")
    return movedNode.path
  }

  return { 
    rootNodes,
    welcomeNoteState: fileState.welcomeNoteState,
    selectedItem,
    currentFile: fileState.currentFile,
    currentPreviewImageNode,
    currentPreviewImageUrl,
    currentFileStatus: fileState.currentFileStatus,
    currentFileDisplayName: fileState.currentFileDisplayName,
    hasCurrentFile: fileState.hasCurrentFile,
    currentPathLabel,
    canEditCurrentFile: fileState.canEditCurrentFile,
    isCurrentFileDirty: fileState.isCurrentFileDirty,
    historyAvailability: historyState.historyAvailability,
    historyTree: historyState.historyTree,
    historyTreeStatus: historyState.historyTreeStatus,
    defaultRevisionId: historyState.defaultRevisionId,
    viewedRevisionId: historyState.viewedRevisionId,
    pendingRevisionId: historyState.pendingRevisionId,
    isCreatePending: (type: 'file' | 'dir') => actionLedger.isActionPending(type === 'file' ? 'create-file' : 'create-dir'),
    isDeletePending: () => actionLedger.isActionPending('delete-item'),
    isUploadPending: () => actionLedger.isActionPending('upload-file'),
    isSavePending: () => actionLedger.isActionPending('save-current-file'),
    isHistoryRevisionPending: () => actionLedger.isActionPending('load-history-revision'),
    isHistoryDeletePending: () => actionLedger.isActionPending('delete-history-revision'),
    currentRenderedFile: fileState.currentRenderedFile,
    ensureWelcomeNoteLoaded,
    loadDirectory,
    getCachedNode,
    getDirectoryChildren,
    getDirectoryLoadState,
    isDirectoryExpanded,
    canExpandDirectory,
    getDirectoryRenderState,
    retryDirectory,
    expandDirectory,
    collapseDirectory,
    toggleDirectory,
    loadFile,
    showWelcome,
    addNewNode,
    selectItem,
    clearSelection,
    resetWorkspaceState,
    closeImagePreview,
    uploadFile,
    uploadPastedImage,
    saveCurrentFile,
    saveCurrentFileIfDirty,
    saveCurrentFileBeforeUnload,
    loadHistoryTree,
    selectHistoryRevision,
    prepareHistoryRevisionDelete,
    deleteHistoryRevision,
    deleteNode,
    renameNode,
    moveNode,
  }
})
