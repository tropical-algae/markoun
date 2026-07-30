import { computed, ref } from 'vue'
import { useCompactLayout } from '@/composables/useCompactLayout'

export type MobileWorkspacePane = 'editor' | 'sidebar' | 'inspector'

export const useWorkspacePanes = () => {
  const isCompactLayout = useCompactLayout()
  const desktopLeftOpen = ref(true)
  const desktopRightOpen = ref(false)
  const mobilePane = ref<MobileWorkspacePane>('editor')

  const isLeftOpen = computed(() => {
    return isCompactLayout.value
      ? mobilePane.value === 'sidebar'
      : desktopLeftOpen.value
  })
  const isRightOpen = computed(() => {
    return isCompactLayout.value
      ? mobilePane.value === 'inspector'
      : desktopRightOpen.value
  })

  const setLeftOpen = (open: boolean) => {
    if (isCompactLayout.value) {
      mobilePane.value = open ? 'sidebar' : 'editor'
      return
    }
    desktopLeftOpen.value = open
  }

  const setRightOpen = (open: boolean) => {
    if (isCompactLayout.value) {
      mobilePane.value = open ? 'inspector' : 'editor'
      return
    }
    desktopRightOpen.value = open
  }

  const closeLeftOnCompact = () => {
    if (isCompactLayout.value && mobilePane.value === 'sidebar') {
      mobilePane.value = 'editor'
    }
  }

  return {
    isCompactLayout,
    isLeftOpen,
    isRightOpen,
    mobilePane,
    setLeftOpen,
    setRightOpen,
    closeLeftOnCompact,
  }
}
