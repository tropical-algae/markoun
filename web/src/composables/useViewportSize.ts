import { onBeforeUnmount, onMounted, ref } from 'vue'

export const useViewportSize = () => {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 900)

  const syncViewportSize = () => {
    width.value = window.visualViewport?.width ?? window.innerWidth
    height.value = window.visualViewport?.height ?? window.innerHeight
  }

  onMounted(() => {
    syncViewportSize()
    window.addEventListener('resize', syncViewportSize)
    window.addEventListener('orientationchange', syncViewportSize)
    window.visualViewport?.addEventListener('resize', syncViewportSize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', syncViewportSize)
    window.removeEventListener('orientationchange', syncViewportSize)
    window.visualViewport?.removeEventListener('resize', syncViewportSize)
  })

  return {
    width,
    height,
  }
}
