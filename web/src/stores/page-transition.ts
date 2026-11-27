import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { readCssTimeMs } from '@/utils/css'

export const usePageTransitionStore = defineStore('page-transition', () => {
  const progress = ref<number | null>(null)
  const isActive = computed(() => progress.value !== null)

  const dismiss = () => { progress.value = null }

  const run = async (
    prepare: (setProgress: (value: number) => void) => Promise<boolean>,
    enter: () => Promise<void>,
  ): Promise<boolean> => {
    if (isActive.value) return false

    const startedAt = performance.now()
    const minimumMs = readCssTimeMs('--motion-page-transition-min-duration', 560)
    progress.value = 16

    try {
      if (!await prepare((value) => { progress.value = value })) return false

      const remainingMs = minimumMs - (performance.now() - startedAt)
      if (remainingMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, remainingMs))
      }

      await enter()
      progress.value = 100
      return true
    } finally {
      if (progress.value !== 100) dismiss()
    }
  }

  return { progress, isActive, run, dismiss }
})
