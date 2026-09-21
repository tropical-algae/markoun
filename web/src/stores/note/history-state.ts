import { ref } from 'vue'
import type { AsyncStatus } from '@/types/async'
import type { HistoryAvailability, HistoryTree } from '@/types/history'
import { getHistoryTreeApi } from '@/api/history'
import { replacePathPrefix } from '@/utils/file-system'
import { normalizeRequestError } from '@/utils/request'

export const useHistoryState = () => {
  const historyAvailability = ref<HistoryAvailability>('unknown')
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
    historyAvailability.value = 'unknown'
    historyTree.value = null
    historyTreeStatus.value = 'idle'
    defaultRevisionId.value = null
    viewedRevisionId.value = null
    baseRevisionId.value = null
    pendingRevisionId.value = null
  }

  const beginHistoryInitialization = (path: string) => {
    treeRequestId += 1
    currentPath = path
    treeWasRequested = false
    historyAvailability.value = 'unknown'
    historyTree.value = null
    historyTreeStatus.value = 'loading'
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
    historyAvailability.value = enabled ? 'enabled' : 'disabled'
    historyTree.value = null
    historyTreeStatus.value = enabled ? 'idle' : 'ready'
    defaultRevisionId.value = revisionId
    viewedRevisionId.value = revisionId
    baseRevisionId.value = revisionId
    pendingRevisionId.value = null
  }

  const failHistoryInitialization = (path: string) => {
    if (path !== currentPath) {
      return
    }
    historyTreeStatus.value = 'error'
  }

  const loadHistoryTree = async (path: string, force = false): Promise<void> => {
    treeWasRequested = true
    if (path !== currentPath) {
      return
    }
    if (historyAvailability.value !== 'enabled') {
      historyTree.value = null
      if (historyAvailability.value === 'disabled') {
        historyTreeStatus.value = 'ready'
      }
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
        const requestError = normalizeRequestError(error)
        if (requestError.status === 409) {
          historyAvailability.value = 'disabled'
          historyTree.value = null
          historyTreeStatus.value = 'ready'
          return
        }
        if (requestError.status === 404) {
          historyTree.value = null
          historyTreeStatus.value = 'ready'
          defaultRevisionId.value = null
          viewedRevisionId.value = null
          baseRevisionId.value = null
          return
        }
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

    historyAvailability.value = enabled ? 'enabled' : 'disabled'
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
    historyAvailability.value = 'enabled'
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
    historyTreeStatus.value = historyAvailability.value === 'enabled'
      ? 'idle'
      : historyAvailability.value === 'disabled'
        ? 'ready'
        : 'loading'
  }

  return {
    historyAvailability,
    historyTree,
    historyTreeStatus,
    defaultRevisionId,
    viewedRevisionId,
    baseRevisionId,
    pendingRevisionId,
    resetHistoryState,
    beginHistoryInitialization,
    initializeHistory,
    failHistoryInitialization,
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
