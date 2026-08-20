import { ref } from 'vue'
import type { AsyncStatus } from '@/types/async'
import type { HistoryTree } from '@/types/history'
import { getHistoryTreeApi } from '@/api/history'
import { replacePathPrefix } from '@/utils/file-system'

export const useHistoryState = () => {
  const historyEnabled = ref(false)
  const historyTree = ref<HistoryTree | null>(null)
  const historyTreeStatus = ref<AsyncStatus>('idle')
  const defaultRevisionId = ref<string | null>(null)
  const viewedRevisionId = ref<string | null>(null)
  const baseRevisionId = ref<string | null>(null)
  const pendingRevisionId = ref<string | null>(null)

  let currentPath = ''
  let treeRequestId = 0
  let treeWasRequested = false

  const resetHistoryState = () => {
    treeRequestId += 1
    currentPath = ''
    treeWasRequested = false
    historyEnabled.value = false
    historyTree.value = null
    historyTreeStatus.value = 'idle'
    defaultRevisionId.value = null
    viewedRevisionId.value = null
    baseRevisionId.value = null
    pendingRevisionId.value = null
  }

  const initializeHistory = (
    path: string,
    enabled: boolean,
    revisionId: string | null,
  ) => {
    treeRequestId += 1
    currentPath = path
    treeWasRequested = false
    historyEnabled.value = enabled
    historyTree.value = null
    historyTreeStatus.value = enabled && revisionId ? 'idle' : 'ready'
    defaultRevisionId.value = revisionId
    viewedRevisionId.value = revisionId
    baseRevisionId.value = revisionId
    pendingRevisionId.value = null
  }

  const loadHistoryTree = async (path: string, force = false): Promise<void> => {
    treeWasRequested = true
    if (!historyEnabled.value || !defaultRevisionId.value || path !== currentPath) {
      historyTree.value = null
      historyTreeStatus.value = 'ready'
      return
    }
    if (!force && historyTreeStatus.value === 'ready' && historyTree.value) {
      return
    }

    const requestId = ++treeRequestId
    historyTreeStatus.value = historyTree.value ? 'refreshing' : 'loading'
    try {
      const response = await getHistoryTreeApi(path)
      if (requestId !== treeRequestId || path !== currentPath) {
        return
      }
      historyTree.value = response.data
      defaultRevisionId.value = response.data.default_revision_id
      historyTreeStatus.value = 'ready'
    } catch (error) {
      if (requestId === treeRequestId && path === currentPath) {
        historyTreeStatus.value = 'error'
      }
      throw error
    }
  }

  const refreshHistoryTreeIfRequested = async (path: string): Promise<void> => {
    if (!treeWasRequested) {
      return
    }
    await loadHistoryTree(path, true)
  }

  const applySaveResult = (
    path: string,
    enabled: boolean,
    revisionId: string | null,
    nextDefaultRevisionId: string | null,
  ) => {
    if (path !== currentPath) {
      return
    }

    historyEnabled.value = enabled
    defaultRevisionId.value = nextDefaultRevisionId
    viewedRevisionId.value = revisionId
    baseRevisionId.value = revisionId
    if (!enabled) {
      historyTree.value = null
      historyTreeStatus.value = 'ready'
    }
  }

  const beginRevisionLoad = (revisionId: string) => {
    pendingRevisionId.value = revisionId
  }

  const completeRevisionLoad = (revisionId: string) => {
    viewedRevisionId.value = revisionId
    baseRevisionId.value = revisionId
    pendingRevisionId.value = null
  }

  const failRevisionLoad = () => {
    pendingRevisionId.value = null
  }

  const replaceHistoryTree = (path: string, tree: HistoryTree) => {
    if (path !== currentPath) {
      return
    }
    historyTree.value = tree
    defaultRevisionId.value = tree.default_revision_id
    historyTreeStatus.value = 'ready'
  }

  const remapHistoryPath = (oldPath: string, newPath: string) => {
    const nextPath = replacePathPrefix(currentPath, oldPath, newPath)
    if (nextPath === currentPath) {
      return
    }
    currentPath = nextPath
    treeRequestId += 1
    historyTree.value = null
    historyTreeStatus.value = historyEnabled.value && defaultRevisionId.value
      ? 'idle'
      : 'ready'
  }

  return {
    historyEnabled,
    historyTree,
    historyTreeStatus,
    defaultRevisionId,
    viewedRevisionId,
    baseRevisionId,
    pendingRevisionId,
    resetHistoryState,
    initializeHistory,
    loadHistoryTree,
    refreshHistoryTreeIfRequested,
    applySaveResult,
    beginRevisionLoad,
    completeRevisionLoad,
    failRevisionLoad,
    replaceHistoryTree,
    remapHistoryPath,
  }
}
