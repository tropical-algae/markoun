import { onBeforeUnmount, ref, type Ref } from 'vue'
import type { FsNode } from '@/types/file-system'

export const FILE_TREE_NODE_MIME = 'application/x-markoun-fs-node'

let activeDraggedTreeNode: FsNode | null = null

export const getActiveDraggedTreeNode = (): FsNode | null => activeDraggedTreeNode

export const readDraggedTreeNode = (event: DragEvent): FsNode | null => {
  if (activeDraggedTreeNode) {
    return activeDraggedTreeNode
  }

  const rawNode = event.dataTransfer?.getData(FILE_TREE_NODE_MIME)
  if (!rawNode) {
    return null
  }

  try {
    return JSON.parse(rawNode) as FsNode
  } catch (_) {
    return null
  }
}

export const useFileTreeNodeDrag = (
  node: Readonly<Ref<FsNode>>,
  canDrag: () => boolean,
) => {
  const isNodeDragging = ref(false)

  const handleNodeDragStart = (event: DragEvent) => {
    if (!canDrag() || !event.dataTransfer) {
      event.preventDefault()
      return
    }

    isNodeDragging.value = true
    activeDraggedTreeNode = node.value
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(FILE_TREE_NODE_MIME, JSON.stringify(node.value))
    event.dataTransfer.setData('text/plain', node.value.path)
  }

  const handleNodeDragEnd = () => {
    isNodeDragging.value = false
    activeDraggedTreeNode = null
  }

  onBeforeUnmount(() => {
    if (activeDraggedTreeNode?.path === node.value.path) {
      activeDraggedTreeNode = null
    }
  })

  return {
    isNodeDragging,
    handleNodeDragStart,
    handleNodeDragEnd,
  }
}
