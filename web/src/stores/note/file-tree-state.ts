import { computed, reactive, shallowReactive } from 'vue'
import { getDirectoryChildrenApi } from '@/api/item'
import type {
  DirectoryLoadState,
  DirectoryRecord,
  DirectoryRenderState,
  FsNode,
} from '@/types/file-system'
import {
  getParentPath,
  isPathInside,
  normalizeNodePath,
  replacePathPrefix,
  ROOT_DIRECTORY_PATH,
} from '@/utils/file-system'
import { normalizeFsNode, remapFsNodePathPrefix, sortFsNodes } from '@/utils/file-node'

interface DirectoryRequest {
  controller: AbortController
  promise: Promise<FsNode[]>
}

const EMPTY_NODES: FsNode[] = []

const createDirectoryRecord = (
  status: DirectoryLoadState = 'idle',
  children: FsNode[] | null = null,
  error: unknown | null = null,
): DirectoryRecord => ({ status, children, error })

export const useFileTreeState = () => {
  const directoryRecords = shallowReactive(new Map<string, DirectoryRecord>())
  const expandedDirectoryPaths = reactive(new Set<string>())
  const directoryRequests = new Map<string, DirectoryRequest>()
  let workspaceGeneration = 0

  const getDirectoryRecord = (path: string): DirectoryRecord | undefined => {
    return directoryRecords.get(normalizeNodePath(path))
  }

  const getDirectoryChildren = (path: string): FsNode[] => {
    return getDirectoryRecord(path)?.children ?? EMPTY_NODES
  }

  const getCachedNode = (path: string): FsNode | undefined => {
    const normalizedPath = normalizeNodePath(path)
    return getDirectoryChildren(getParentPath(normalizedPath)).find(
      (node) => node.path === normalizedPath,
    )
  }

  const getDirectoryLoadState = (path: string): DirectoryLoadState => {
    return getDirectoryRecord(path)?.status ?? 'idle'
  }

  const isDirectoryLoaded = (path: string): boolean => {
    return getDirectoryLoadState(path) === 'loaded'
  }

  const isDirectoryExpanded = (path: string): boolean => {
    const normalizedPath = normalizeNodePath(path)
    return normalizedPath === ROOT_DIRECTORY_PATH || expandedDirectoryPaths.has(normalizedPath)
  }

  const rootNodes = computed(() => getDirectoryChildren(ROOT_DIRECTORY_PATH))

  const replaceDirectorySummary = (path: string, hasChildren: boolean) => {
    const normalizedPath = normalizeNodePath(path)
    if (normalizedPath === ROOT_DIRECTORY_PATH) {
      return
    }

    const parentPath = getParentPath(normalizedPath)
    const parentRecord = getDirectoryRecord(parentPath)
    if (parentRecord?.status !== 'loaded' || parentRecord.children === null) {
      return
    }

    let changed = false
    const nextChildren = parentRecord.children.map((node) => {
      if (node.path !== normalizedPath || node.type !== 'dir' || node.has_children === hasChildren) {
        return node
      }
      changed = true
      return { ...node, has_children: hasChildren }
    })
    if (changed) {
      directoryRecords.set(parentPath, { ...parentRecord, children: nextChildren })
    }
  }

  const reconcileDirectory = (path: string) => {
    const normalizedPath = normalizeNodePath(path)
    const record = getDirectoryRecord(normalizedPath)
    if (record?.status !== 'loaded' || record.children === null) {
      return
    }

    const hasChildren = record.children.length > 0
    replaceDirectorySummary(normalizedPath, hasChildren)
    if (!hasChildren) {
      expandedDirectoryPaths.delete(normalizedPath)
    }
  }

  const replaceDirectoryChildren = (path: string, children: FsNode[]): FsNode[] => {
    const normalizedPath = normalizeNodePath(path)
    const normalizedChildren = sortFsNodes(children.map((node) => normalizeFsNode(node)))
    directoryRecords.set(normalizedPath, createDirectoryRecord('loaded', normalizedChildren))
    reconcileDirectory(normalizedPath)
    return normalizedChildren
  }

  const cancelDirectoryRequest = (path: string) => {
    const normalizedPath = normalizeNodePath(path)
    const request = directoryRequests.get(normalizedPath)
    if (!request) {
      return
    }
    directoryRequests.delete(normalizedPath)
    request.controller.abort()
  }

  const cancelDirectoryRequestsInside = (path: string) => {
    const normalizedPath = normalizeNodePath(path)
    for (const [requestPath, request] of directoryRequests) {
      if (!isPathInside(requestPath, normalizedPath)) {
        continue
      }
      directoryRequests.delete(requestPath)
      request.controller.abort()
    }
  }

  const loadDirectory = async (path: string = ROOT_DIRECTORY_PATH): Promise<FsNode[]> => {
    const normalizedPath = normalizeNodePath(path)
    const requestGeneration = workspaceGeneration
    if (isDirectoryLoaded(normalizedPath)) {
      return getDirectoryChildren(normalizedPath)
    }

    const pendingRequest = directoryRequests.get(normalizedPath)
    if (pendingRequest) {
      return pendingRequest.promise
    }

    const controller = new AbortController()
    directoryRecords.set(normalizedPath, createDirectoryRecord('loading'))

    let request: DirectoryRequest
    const promise = getDirectoryChildrenApi(normalizedPath, controller.signal)
      .then((response) => {
        if (
          requestGeneration !== workspaceGeneration
          || directoryRequests.get(normalizedPath) !== request
        ) {
          return getDirectoryChildren(normalizedPath)
        }
        return replaceDirectoryChildren(response.data.path, response.data.children)
      })
      .catch((error) => {
        if (
          requestGeneration !== workspaceGeneration
          || directoryRequests.get(normalizedPath) !== request
        ) {
          return getDirectoryChildren(normalizedPath)
        }
        directoryRecords.set(normalizedPath, createDirectoryRecord('error', null, error))
        throw error
      })
      .finally(() => {
        if (directoryRequests.get(normalizedPath) === request) {
          directoryRequests.delete(normalizedPath)
        }
      })

    request = { controller, promise }
    directoryRequests.set(normalizedPath, request)
    return promise
  }

  const expandDirectory = async (path: string): Promise<FsNode[]> => {
    const normalizedPath = normalizeNodePath(path)
    if (normalizedPath !== ROOT_DIRECTORY_PATH) {
      expandedDirectoryPaths.add(normalizedPath)
    }
    return await loadDirectory(normalizedPath)
  }

  const collapseDirectory = (path: string) => {
    const normalizedPath = normalizeNodePath(path)
    if (normalizedPath !== ROOT_DIRECTORY_PATH) {
      expandedDirectoryPaths.delete(normalizedPath)
    }
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

  const canExpandDirectory = (node: FsNode): boolean => {
    if (node.type !== 'dir') {
      return false
    }
    const record = getDirectoryRecord(node.path)
    if (record?.status === 'loaded' && record.children !== null) {
      return record.children.length > 0
    }
    return node.has_children !== false
  }

  const getDirectoryRenderState = (node: FsNode): DirectoryRenderState => {
    if (node.type !== 'dir') {
      return 'collapsed'
    }
    const record = getDirectoryRecord(node.path)
    if (record?.status === 'loaded' && record.children?.length === 0) {
      return 'empty'
    }
    if (!isDirectoryExpanded(node.path)) {
      return 'collapsed'
    }
    if (!record || record.status === 'idle' || record.status === 'loading') {
      return 'loading'
    }
    if (record.status === 'error') {
      return 'error'
    }
    return 'content'
  }

  const insertNode = (parentPath: string, node: FsNode): FsNode => {
    const normalizedParentPath = normalizeNodePath(parentPath)
    const normalizedNode = normalizeFsNode(node)
    const parentRecord = getDirectoryRecord(normalizedParentPath)
    if (parentRecord?.status === 'loaded' && parentRecord.children !== null) {
      const nextChildren = parentRecord.children.filter((child) => child.path !== normalizedNode.path)
      nextChildren.push(normalizedNode)
      replaceDirectoryChildren(normalizedParentPath, nextChildren)
    } else {
      cancelDirectoryRequest(normalizedParentPath)
      directoryRecords.set(normalizedParentPath, createDirectoryRecord())
      replaceDirectorySummary(normalizedParentPath, true)
      if (isDirectoryExpanded(normalizedParentPath)) {
        void loadDirectory(normalizedParentPath).catch(() => null)
      }
    }
    return normalizedNode
  }

  const removeNodeFromParent = (path: string) => {
    const normalizedPath = normalizeNodePath(path)
    const parentPath = getParentPath(normalizedPath)
    const parentRecord = getDirectoryRecord(parentPath)
    if (parentRecord?.status !== 'loaded' || parentRecord.children === null) {
      return
    }
    replaceDirectoryChildren(
      parentPath,
      parentRecord.children.filter((child) => child.path !== normalizedPath),
    )
  }

  const remapCachedSubtree = (oldPath: string, newPath: string, exactName: string) => {
    const normalizedOldPath = normalizeNodePath(oldPath)
    const normalizedNewPath = normalizeNodePath(newPath)
    cancelDirectoryRequestsInside(normalizedOldPath)

    const remappedRecords: Array<[string, DirectoryRecord]> = []
    const directoriesToReload: string[] = []
    for (const [directoryPath, record] of directoryRecords) {
      if (!isPathInside(directoryPath, normalizedOldPath)) {
        continue
      }
      directoryRecords.delete(directoryPath)
      const remappedPath = replacePathPrefix(
        directoryPath,
        normalizedOldPath,
        normalizedNewPath,
      )
      if (record.status === 'loading') {
        directoriesToReload.push(remappedPath)
        remappedRecords.push([remappedPath, createDirectoryRecord()])
      } else {
        remappedRecords.push([
          remappedPath,
          {
            ...record,
            children: record.children?.map((child) => (
              remapFsNodePathPrefix(child, normalizedOldPath, normalizedNewPath, exactName)
            )) ?? null,
          },
        ])
      }
    }
    for (const [directoryPath, record] of remappedRecords) {
      directoryRecords.set(directoryPath, record)
    }

    const remappedExpandedPaths: string[] = []
    for (const directoryPath of expandedDirectoryPaths) {
      if (!isPathInside(directoryPath, normalizedOldPath)) {
        continue
      }
      expandedDirectoryPaths.delete(directoryPath)
      remappedExpandedPaths.push(
        replacePathPrefix(directoryPath, normalizedOldPath, normalizedNewPath),
      )
    }
    remappedExpandedPaths.forEach((path) => expandedDirectoryPaths.add(path))
    directoriesToReload.forEach((path) => {
      void loadDirectory(path).catch(() => null)
    })
  }

  const renameSubtree = (oldPath: string, newPath: string, exactName: string) => {
    const normalizedOldPath = normalizeNodePath(oldPath)
    const parentPath = getParentPath(normalizedOldPath)
    const parentRecord = getDirectoryRecord(parentPath)
    if (parentRecord?.status === 'loaded' && parentRecord.children !== null) {
      replaceDirectoryChildren(
        parentPath,
        parentRecord.children.map((node) => (
          remapFsNodePathPrefix(node, normalizedOldPath, newPath, exactName)
        )),
      )
    }
    remapCachedSubtree(normalizedOldPath, newPath, exactName)
  }

  const removeSubtree = (path: string) => {
    const normalizedPath = normalizeNodePath(path)
    removeNodeFromParent(normalizedPath)
    cancelDirectoryRequestsInside(normalizedPath)
    for (const directoryPath of directoryRecords.keys()) {
      if (isPathInside(directoryPath, normalizedPath)) {
        directoryRecords.delete(directoryPath)
      }
    }
    for (const directoryPath of expandedDirectoryPaths) {
      if (isPathInside(directoryPath, normalizedPath)) {
        expandedDirectoryPaths.delete(directoryPath)
      }
    }
  }

  const moveSubtree = (oldPath: string, targetDir: string, node: FsNode): FsNode => {
    const normalizedOldPath = normalizeNodePath(oldPath)
    const normalizedTargetDir = normalizeNodePath(targetDir)
    const normalizedNode = normalizeFsNode(node)
    if (normalizedOldPath === normalizedNode.path) {
      return normalizedNode
    }

    removeNodeFromParent(normalizedOldPath)
    remapCachedSubtree(normalizedOldPath, normalizedNode.path, normalizedNode.name)
    insertNode(normalizedTargetDir, normalizedNode)
    return normalizedNode
  }

  const retryDirectory = async (path: string): Promise<FsNode[]> => {
    directoryRecords.delete(normalizeNodePath(path))
    return await loadDirectory(path)
  }

  const resetFileTree = () => {
    workspaceGeneration += 1
    directoryRequests.forEach((request) => request.controller.abort())
    directoryRequests.clear()
    directoryRecords.clear()
    expandedDirectoryPaths.clear()
  }

  return {
    rootNodes,
    getCachedNode,
    getDirectoryChildren,
    getDirectoryLoadState,
    isDirectoryLoaded,
    isDirectoryExpanded,
    canExpandDirectory,
    getDirectoryRenderState,
    loadDirectory,
    retryDirectory,
    expandDirectory,
    collapseDirectory,
    toggleDirectory,
    insertNode,
    renameSubtree,
    removeSubtree,
    moveSubtree,
    resetFileTree,
  }
}
