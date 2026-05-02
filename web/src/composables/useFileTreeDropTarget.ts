import { ref, type Ref } from 'vue'
import { useFileUploadTask } from '@/composables/useFileUploadTask'
import {
  FILE_TREE_NODE_MIME,
  getActiveDraggedTreeNode,
  readDraggedTreeNode,
} from '@/composables/useFileTreeNodeDrag'
import type { FsNode } from '@/types/file-system'
import { getParentPath, isPathInside, normalizeNodePath } from '@/utils/file-system'

interface UseFileTreeDropTargetOptions {
  isDirectory: Readonly<Ref<boolean>>;
  getDestinationPath: () => string;
  selectDirectory?: () => Promise<void>;
  moveNode: (node: FsNode, targetDir: string) => Promise<void>;
}

const hasDraggedFiles = (event: DragEvent): boolean => {
  const types = event.dataTransfer?.types
  return Boolean(types && Array.from(types).includes('Files'))
}

const hasDraggedTreeNode = (event: DragEvent): boolean => {
  if (getActiveDraggedTreeNode()) {
    return true
  }

  const types = event.dataTransfer?.types
  return Boolean(types && Array.from(types).includes(FILE_TREE_NODE_MIME))
}

export const useFileTreeDropTarget = (options: UseFileTreeDropTargetOptions) => {
  const uploadTask = useFileUploadTask()
  const isDirectoryDragOver = ref(false)
  let dragDepth = 0

  const resetDirectoryDragState = () => {
    dragDepth = 0
    isDirectoryDragOver.value = false
  }

  const canMoveNodeToTarget = (node: FsNode): boolean => {
    const destinationPath = normalizeNodePath(options.getDestinationPath())
    const sourcePath = normalizeNodePath(node.path)

    if (sourcePath === destinationPath || getParentPath(sourcePath) === destinationPath) {
      return false
    }

    return node.type !== 'dir' || !isPathInside(destinationPath, sourcePath)
  }

  const getDropKind = (event: DragEvent): 'file' | 'node' | null => {
    if (!options.isDirectory.value) {
      return null
    }

    if (hasDraggedFiles(event)) {
      return 'file'
    }

    if (hasDraggedTreeNode(event)) {
      const draggedNode = readDraggedTreeNode(event)
      return draggedNode && canMoveNodeToTarget(draggedNode) ? 'node' : null
    }

    return null
  }

  const handleDirectoryDragEnter = (event: DragEvent) => {
    if (!getDropKind(event)) {
      return
    }

    dragDepth += 1
    isDirectoryDragOver.value = true
  }

  const handleDirectoryDragOver = (event: DragEvent) => {
    const dropKind = getDropKind(event)
    if (!dropKind || !event.dataTransfer) {
      return
    }

    event.dataTransfer.dropEffect = dropKind === 'file' ? 'copy' : 'move'
    isDirectoryDragOver.value = true
  }

  const handleDirectoryDragLeave = (event: DragEvent) => {
    if (!getDropKind(event)) {
      return
    }

    dragDepth = Math.max(0, dragDepth - 1)
    if (dragDepth === 0) {
      isDirectoryDragOver.value = false
    }
  }

  const handleDirectoryDrop = async (event: DragEvent) => {
    const dropKind = getDropKind(event)
    if (!dropKind) {
      resetDirectoryDragState()
      return
    }

    const destinationPath = normalizeNodePath(options.getDestinationPath())
    resetDirectoryDragState()

    if (dropKind === 'node') {
      const draggedNode = readDraggedTreeNode(event)
      if (draggedNode) {
        await options.moveNode(draggedNode, destinationPath)
      }
      return
    }

    const file = event.dataTransfer?.files?.[0]
    if (!file) {
      return
    }

    await options.selectDirectory?.()
    await uploadTask.uploadFile(file, destinationPath)
  }

  return {
    ...uploadTask,
    isDirectoryDragOver,
    resetDirectoryDragState,
    handleDirectoryDragEnter,
    handleDirectoryDragOver,
    handleDirectoryDragLeave,
    handleDirectoryDrop,
  }
}
