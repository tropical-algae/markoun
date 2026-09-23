import { computed, type Ref } from 'vue'
import { useNodeStore } from '@/stores/note'
import type { FsNode } from '@/types/file-system'

export const useFileTreeItemExpansion = (
  node: Readonly<Ref<FsNode>>,
  isDirectory: Readonly<Ref<boolean>>,
) => {
  const nodeStore = useNodeStore()

  const renderState = computed(() => {
    return nodeStore.getDirectoryRenderState(node.value)
  })

  const isOpened = computed(() => {
    return isDirectory.value && ['loading', 'error', 'content'].includes(renderState.value)
  })

  const normalizedChildren = computed(() => {
    return nodeStore.getDirectoryChildren(node.value.path)
  })

  const canExpand = computed(() => {
    return isDirectory.value && nodeStore.canExpandDirectory(node.value)
  })

  const retryDirectory = () => {
    void nodeStore.retryDirectory(node.value.path).catch(() => null)
  }

  return {
    renderState,
    isOpened,
    normalizedChildren,
    canExpand,
    retryDirectory,
  }
}
