import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  DEFAULT_VIEWPORT_HEIGHT,
  DEFAULT_VIEWPORT_WIDTH,
} from '@/constants/layout'

export const useViewportSize = () => {
  const width = ref(
    typeof window !== 'undefined' ? window.innerWidth : DEFAULT_VIEWPORT_WIDTH,
  )
  const height = ref(
    typeof window !== 'undefined' ? window.innerHeight : DEFAULT_VIEWPORT_HEIGHT,
  )

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
