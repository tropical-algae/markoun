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
  joinRelativePath,
  normalizeNodePath,
  replacePathPrefix,
  ROOT_DIRECTORY_PATH,
} from "@/utils/file-system";
import { getFileContentApi, createNoteApi, uploadFileApi, saveNoteApi } from "@/api/file";
import { getDirectoryChildrenApi, removeItemApi, renameItemApi } from "@/api/item";
import { createDirApi } from "@/api/dir";
import marked from "@/utils/markdown";
import { Renderer } from "marked";

export const useNodeStore = defineStore('note', () => {
  const MIN_FILE_SKELETON_MS = 500
  const defaultFileContent = {
    name: 'WELCOME',
    path: '',
    suffix: '',
    content: '## Hi, this is Markoun\n\nA clean and powerful online Markdown editor.',
    meta: {}
  }

  const directoryChildrenByPath = ref<Record<string, FsNode[]>>({})
  const directoryLoadStateByPath = ref<Record<string, DirectoryLoadState>>({})
  const expandedDirPaths = ref<Record<string, boolean>>({})
  const currentNode = ref<FsNode | null>(null)
  const currentFileNode = ref<FsNode | null>(null)

  const currentFileStatus = ref<AsyncStatus>('ready')
  const currentFile = ref<FileDetail>(defaultFileContent)
  const fileDetailsByPath = ref<Record<string, FileDetail>>({})
  const currentParentPath = computed(() => getParentPath(currentNode.value ?? currentFileNode.value))
  const currentFileParentPath = computed(() => getParentPath(currentFileNode.value ?? currentFile.value.path))
  const currentPathLabel = computed(() => currentParentPath.value === ROOT_DIRECTORY_PATH ? '/' : currentParentPath.value)
  const rootNodes = computed(() => directoryChildrenByPath.value[ROOT_DIRECTORY_PATH] || [])
  const currentFileDisplayName = computed(() => currentFileNode.value?.name || currentFile.value.name)
  const canEditCurrentFile = computed(() => currentFileStatus.value === 'ready' && Boolean(currentFileNode.value))
  const isCurrentFileLoading = computed(() => currentFileStatus.value === 'loading')
  const isCurrentFileRefreshing = computed(() => currentFileStatus.value === 'refreshing')
  const currrentRenderedFile = computed(() => renderCurrentFileContent())

  var isInitialized = false
  const directoryRequests = new Map<string, Promise<FsNode[]>>()
  let currentFileRequestId = 0

  const toastStore = useToastStore()
  const actionLedger = useActionLedger()

  const normalizeFsNode = (node: FsNode): FsNode => ({
    ...node,
    path: normalizeNodePath(node.path),
  })

  const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  const sortNodes = (nodes: FsNode[]): FsNode[] => {
    return [...nodes].sort((left, right) => {
      if (left.type !== right.type) {
        return left.type === 'dir' ? -1 : 1
      }

      const leftIsMarkdown = left.suffix.toLowerCase() === 'md'
      const rightIsMarkdown = right.suffix.toLowerCase() === 'md'
      if (leftIsMarkdown !== rightIsMarkdown) {
        return leftIsMarkdown ? -1 : 1
      }

      const suffixResult = left.suffix.localeCompare(right.suffix)
      if (suffixResult !== 0) {
        return suffixResult
      }

      return left.name.localeCompare(right.name)
    })
  }

  const replaceDirectoryChildren = (path: string, children: FsNode[]): FsNode[] => {
    const normalizedPath = normalizeNodePath(path)
    const normalizedChildren = sortNodes(children.map((node) => normalizeFsNode(node)))
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

  const hasLoadedDirectory = (path: string): boolean => {
    return getDirectoryLoadState(path) === 'loaded'
  }

  const isDirectoryExpanded = (path: string): boolean => {
    const normalizedPath = normalizeNodePath(path)
    return normalizedPath === ROOT_DIRECTORY_PATH || Boolean(expandedDirPaths.value[normalizedPath])
  }

  const buildFileDetailShell = (node: FsNode): FileDetail => ({
    name: node.name,
    path: node.path,
    suffix: node.suffix,
    content: '',
    meta: {},
  })

  const resetCurrentFileState = () => {
    currentFileNode.value = null
    currentFile.value = { ...defaultFileContent }
    currentFileStatus.value = 'ready'
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

  const remapCachedPathPrefix = (oldPath: string, newPath: string, exactName: string) => {
    const nextDirectoryChildrenByPath: Record<string, FsNode[]> = {}
    for (const [directoryPath, children] of Object.entries(directoryChildrenByPath.value)) {
      const nextDirectoryPath = replacePathPrefix(directoryPath, oldPath, newPath)
      nextDirectoryChildrenByPath[nextDirectoryPath] = sortNodes(
        children.map((child) => {
          const nextChildPath = replacePathPrefix(child.path, oldPath, newPath)
          if (nextChildPath === child.path) {
            return child
          }

          return {
            ...child,
            path: nextChildPath,
            name: child.path === oldPath ? exactName : child.name,
          }
        })
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

    const nextFileDetailsByPath: Record<string, FileDetail> = {}
    for (const [path, fileDetail] of Object.entries(fileDetailsByPath.value)) {
      const nextPath = replacePathPrefix(path, oldPath, newPath)
      nextFileDetailsByPath[nextPath] = {
        ...fileDetail,
        path: nextPath,
        name: path === oldPath ? exactName : fileDetail.name,
        meta: {
          ...fileDetail.meta,
          path: replacePathPrefix(fileDetail.meta.path || '', oldPath, newPath),
        }
      }
    }
    fileDetailsByPath.value = nextFileDetailsByPath

    const nextCurrentFilePath = replacePathPrefix(currentFile.value.path, oldPath, newPath)
    if (nextCurrentFilePath !== currentFile.value.path) {
      currentFile.value = {
        ...currentFile.value,
        path: nextCurrentFilePath,
        name: currentFile.value.path === oldPath ? exactName : currentFile.value.name,
        meta: {
          ...currentFile.value.meta,
          path: replacePathPrefix(currentFile.value.meta.path || '', oldPath, newPath),
        }
      }
    }
  }

  const removeNodeFromCache = (path: string) => {
    const normalizedPath = normalizeNodePath(path)
    const nextDirectoryChildrenByPath: Record<string, FsNode[]> = {}
    for (const [directoryPath, children] of Object.entries(directoryChildrenByPath.value)) {
      if (isPathInside(directoryPath, normalizedPath)) {
        continue
      }

      nextDirectoryChildrenByPath[directoryPath] = children.filter(
        (child) => !isPathInside(child.path, normalizedPath)
      )
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

    const nextFileDetailsByPath: Record<string, FileDetail> = {}
    for (const [filePath, fileDetail] of Object.entries(fileDetailsByPath.value)) {
      if (!isPathInside(filePath, normalizedPath)) {
        nextFileDetailsByPath[filePath] = fileDetail
      }
    }
    fileDetailsByPath.value = nextFileDetailsByPath
  }

  const buildRenamedPath = (node: FsNode, newName: string): string => {
    const parentPath = getParentPath(node.path)
    const nextName = node.type === 'file' && node.suffix
      ? `${newName}.${node.suffix}`
      : newName
    return joinRelativePath(parentPath, nextName)
  }

  const renderCurrentFileContent = (): string => {
    const parentPath = getParentPath(currentFile.value.path);
    const customRenderer = new Renderer();
    customRenderer.image = ({ href, title, text }: any) => {
      const mediaPath = getMediaPath(parentPath, href);
      return `<img src="${mediaPath}" title="${title || ''}" alt="${text || ''}" />`;
    };

    return marked.parse(currentFile.value.content, { 
      renderer: customRenderer,
      async: false 
    });
  };

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

    if (currentNode.value?.path === normalizedNode.path) {
      currentNode.value = normalizedNode
    }
    if (currentFileNode.value?.path === normalizedNode.path) {
      currentFileNode.value = normalizedNode
    }
  }

  const refreshCurrentFile = async (node: FsNode) => {
    if (node.type !== 'file' || node.suffix.toLowerCase() !== 'md') {
      return
    }

    const normalizedNode = normalizeFsNode(node)
    if (currentFileNode.value?.path === normalizedNode.path) {
      if (currentFileStatus.value === 'ready') {
        currentNode.value = normalizedNode
        return
      }
      if (currentFileStatus.value === 'loading' || currentFileStatus.value === 'refreshing') {
        currentNode.value = normalizedNode
        return
      }
    }

    const cachedFile = fileDetailsByPath.value[normalizedNode.path]
    const requestId = ++currentFileRequestId

    currentNode.value = normalizedNode
    currentFileNode.value = normalizedNode
    currentFile.value = cachedFile
      ? {
          ...cachedFile,
          name: normalizedNode.name,
          path: normalizedNode.path,
          suffix: normalizedNode.suffix,
        }
      : buildFileDetailShell(normalizedNode)
    currentFileStatus.value = cachedFile ? 'refreshing' : 'loading'
    isInitialized = false
    const minimumSkeletonDelay = sleep(MIN_FILE_SKELETON_MS)

    try {
      const response = await getFileContentApi(normalizedNode.path)
      await minimumSkeletonDelay
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
      fileDetailsByPath.value = {
        ...fileDetailsByPath.value,
        [normalizedNode.path]: nextFile,
      }
      currentFileStatus.value = 'ready'
      isInitialized = true
    } catch (error) {
      await minimumSkeletonDelay
      if (
        requestId !== currentFileRequestId
        || currentFileNode.value?.path !== normalizedNode.path
      ) {
        return
      }

      currentFileStatus.value = 'error'
      currentFile.value = cachedFile
        ? {
            ...cachedFile,
            name: normalizedNode.name,
            path: normalizedNode.path,
            suffix: normalizedNode.suffix,
          }
        : buildFileDetailShell(normalizedNode)
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
    if (normalizedNode.type === 'file' && normalizedNode.suffix.toLowerCase() === 'md') {
      void refreshCurrentFile(normalizedNode)
    } else if (node.type === 'dir') {
      currentNode.value = normalizedNode
    } else {
      currentNode.value = normalizedNode
      toastStore.pushNotice('warning', `WARNING: The selected object cannot be opened.`)
    }
  }

  const clearCurrentNode = () => {
    currentNode.value = null
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
    fileDetailsByPath.value = {
      ...fileDetailsByPath.value,
      [currentFile.value.path]: {
        ...currentFile.value,
      }
    }
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

    removeNodeFromCache(targetPath)

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
    remapCachedPathPrefix(normalizedOldPath, normalizedNewPath, newName)
    toastStore.pushNotice('info', "Rename successful!")
  }

  return { 
    rootNodes,
    currentNode,
    currentFile,
    currentFileStatus,
    currentFileDisplayName,
    currentPath: currentParentPath,
    currentFileParentPath,
    currentPathLabel,
    canEditCurrentFile,
    isCurrentFileLoading,
    isCurrentFileRefreshing,
    isCreatePending: (type: 'file' | 'dir') => actionLedger.isActionPending(type === 'file' ? 'create-file' : 'create-dir'),
    isDeletePending: () => actionLedger.isActionPending('delete-item'),
    isUploadPending: () => actionLedger.isActionPending('upload-file'),
    isSavePending: () => actionLedger.isActionPending('save-current-file'),
    currrentRenderedFile,
    loadDirectory,
    getDirectoryChildren,
    getDirectoryLoadState,
    isDirectoryExpanded,
    hasLoadedDirectory,
    expandDirectory,
    collapseDirectory,
    toggleDirectory,
    refreshCurrentFile,
    addNewNode,
    setCurrentNode,
    clearCurrentNode,
    uploadFile,
    saveCurrentFile,
    deletedItem,
    renameNode,
  }
});
