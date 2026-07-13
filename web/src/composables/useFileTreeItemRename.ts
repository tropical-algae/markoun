import {
  nextTick,
  onBeforeUnmount,
  ref,
  type ComponentPublicInstance,
  type Ref,
} from 'vue'
import { readCssTimeMs } from '@/utils/css'
import type { FsNode } from '@/types/file-system'

export const useFileTreeItemRename = (
  node: Readonly<Ref<FsNode>>,
  renameNode: (node: FsNode, newName: string) => Promise<void>,
) => {
  const editName = ref('')
  const isRenaming = ref(false)
  const isLongPressed = ref(false)
  const renameInputRef = ref<HTMLInputElement | null>(null)
  let pressTimer: number | null = null
  let activePointerId: number | null = null

  const cancelLongPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer)
      pressTimer = null
    }
    activePointerId = null
  }

  const enterRenameMode = async () => {
    editName.value = node.value.name
    isRenaming.value = true

    await nextTick()
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  }

  const startLongPress = (event: PointerEvent) => {
    if (event.button !== 0 || isRenaming.value) {
      return
    }

    cancelLongPress()
    activePointerId = event.pointerId
    isLongPressed.value = false
    pressTimer = window.setTimeout(() => {
      pressTimer = null
      isLongPressed.value = true
      void enterRenameMode()
    }, readCssTimeMs('--tree-long-press-delay-ms', 600))
  }

  const stopLongPress = (event?: PointerEvent) => {
    if (event && activePointerId !== null && event.pointerId !== activePointerId) {
      return
    }

    cancelLongPress()
  }

  const cancelRename = () => {
    isRenaming.value = false
  }

  const submitRename = async () => {
    const nextName = editName.value.trim()
    if (!nextName || nextName === node.value.name) {
      cancelRename()
      return
    }

    await renameNode(node.value, nextName)
    isRenaming.value = false
  }

  const setRenameInputRef = (element: Element | ComponentPublicInstance | null) => {
    renameInputRef.value = element instanceof HTMLInputElement ? element : null
  }

  onBeforeUnmount(() => {
    cancelLongPress()
  })

  return {
    editName,
    isRenaming,
    isLongPressed,
    setRenameInputRef,
    startLongPress,
    stopLongPress,
    submitRename,
    cancelRename,
  }
}
