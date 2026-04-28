import { computed, ref } from 'vue'
import { getDirectoryChildrenApi } from '@/api/item'
import type { DirectoryLoadState, FsNode } from '@/types/file-system'
import {
  isPathInside,
  normalizeNodePath,
  replacePathPrefix,
  ROOT_DIRECTORY_PATH,
} from '@/utils/file-system'
import { normalizeFsNode, sortFsNodes } from '@/utils/file-node'

const remapNodePathPrefix = (
  node: FsNode,
  oldPath: string,
  newPath: string,
  exactName: string,
): FsNode => {
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

export const useFileTreeState = () => {
  const directoryChildrenByPath = ref<Record<string, FsNode[]>>({})
  const directoryLoadStateByPath = ref<Record<string, DirectoryLoadState>>({})
  const expandedDirPaths = ref<Record<string, boolean>>({})
  const directoryRequests = new Map<string, Promise<FsNode[]>>()

  const rootNodes = computed(() => directoryChildrenByPath.value[ROOT_DIRECTORY_PATH] || [])

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

  const upsertNode = (parentPath: string, node: FsNode) => {
    const normalizedParentPath = normalizeNodePath(parentPath)
    const normalizedNode = normalizeFsNode(node)
    const nextChildren = getDirectoryChildren(normalizedParentPath).filter(
      (child) => child.path !== normalizedNode.path
    )
    nextChildren.push(normalizedNode)
    replaceDirectoryChildren(normalizedParentPath, nextChildren)
    return normalizedNode
  }

  const remapDirectoryTreePathPrefix = (
    oldPath: string,
    newPath: string,
    exactName: string,
  ) => {
    const nextDirectoryChildrenByPath: Record<string, FsNode[]> = {}
    for (const [directoryPath, children] of Object.entries(directoryChildrenByPath.value)) {
      nextDirectoryChildrenByPath[replacePathPrefix(directoryPath, oldPath, newPath)] = sortFsNodes(
        children.map((child) => remapNodePathPrefix(child, oldPath, newPath, exactName)),
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
  }

  return {
    rootNodes,
    getDirectoryChildren,
    getDirectoryLoadState,
    isDirectoryExpanded,
    loadDirectory,
    expandDirectory,
    collapseDirectory,
    toggleDirectory,
    ensureDirectoryVisible,
    upsertNode,
    remapDirectoryTreePathPrefix,
    removeNodeFromDirectoryTree,
  }
}

