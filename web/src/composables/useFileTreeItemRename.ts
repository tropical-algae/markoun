import {
  nextTick,
  onBeforeUnmount,
  ref,
  type ComponentPublicInstance,
  type Ref,
} from 'vue'
import { TREE_LONG_PRESS_DELAY_MS } from '@/constants/ui'
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

  const cancelLongPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer)
      pressTimer = null
    }
  }

  const enterRenameMode = async () => {
    editName.value = node.value.name
    isRenaming.value = true

    await nextTick()
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  }

  const onLongPress = () => {
    isLongPressed.value = false
    pressTimer = window.setTimeout(() => {
      isLongPressed.value = true
      void enterRenameMode()
    }, TREE_LONG_PRESS_DELAY_MS)
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
    onLongPress,
    cancelLongPress,
    submitRename,
    cancelRename,
  }
}
