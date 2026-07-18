import { computed, type Ref } from 'vue'
import { useNodeStore } from '@/stores/note'
import { useHeightMotion } from '@/composables/useHeightMotion'
import type { AsyncStatus } from '@/types/async'
import type { FsNode } from '@/types/file-system'

export const useFileTreeItemExpansion = (
  node: Readonly<Ref<FsNode>>,
  isDirectory: Readonly<Ref<boolean>>,
  childrenPanelRef: Ref<HTMLElement | null>,
  childrenContentRef: Ref<HTMLElement | null>,
) => {
  const nodeStore = useNodeStore()
  const childrenMotion = useHeightMotion(childrenPanelRef, childrenContentRef)

  const isOpened = computed(() => {
    return isDirectory.value && nodeStore.isDirectoryExpanded(node.value.path)
  })

  const normalizedChildren = computed(() => {
    return nodeStore.getDirectoryChildren(node.value.path)
  })

  const childLoadStatus = computed<AsyncStatus>(() => {
    const state = nodeStore.getDirectoryLoadState(node.value.path)
    if (state === 'loaded') {
      return 'ready'
    }
    return state
  })

  const canExpand = computed(() => {
    return isDirectory.value &&
      (node.value.has_children !== false || normalizedChildren.value.length > 0)
  })

  const onEnter = (element: Element, done: () => void) => {
    childrenMotion.enter(element, () => {
      childrenMotion.connectResizeObserver(() => isOpened.value)
      done()
    })
  }

  return {
    isOpened,
    normalizedChildren,
    childLoadStatus,
    canExpand,
    onEnter,
    onLeave: childrenMotion.leave,
  }
}
