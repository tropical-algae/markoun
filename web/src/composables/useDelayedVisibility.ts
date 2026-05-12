import {
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'

interface UseDelayedVisibilityOptions {
  delayMs: MaybeRefOrGetter<number>
  minVisibleMs: MaybeRefOrGetter<number>
}

export const useDelayedVisibility = (
  source: MaybeRefOrGetter<boolean>,
  options: UseDelayedVisibilityOptions,
) => {
  const isVisible = ref(false)
  let visibleAt = 0
  let showTimer: number | null = null
  let hideTimer: number | null = null

  const clearShowTimer = () => {
    if (showTimer !== null) {
      window.clearTimeout(showTimer)
      showTimer = null
    }
  }

  const clearHideTimer = () => {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  const show = () => {
    if (isVisible.value) {
      return
    }

    isVisible.value = true
    visibleAt = Date.now()
  }

  const hide = () => {
    isVisible.value = false
    visibleAt = 0
  }

  watch(
    () => Boolean(toValue(source)),
    (shouldShow) => {
      if (shouldShow) {
        clearHideTimer()

        if (isVisible.value) {
          return
        }

        clearShowTimer()
        showTimer = window.setTimeout(() => {
          showTimer = null
          if (Boolean(toValue(source))) {
            show()
          }
        }, toValue(options.delayMs))
        return
      }

      clearShowTimer()

      if (!isVisible.value) {
        return
      }

      const remaining = Math.max(
        0,
        toValue(options.minVisibleMs) - (Date.now() - visibleAt),
      )
      clearHideTimer()
      if (remaining === 0) {
        hide()
        return
      }

      hideTimer = window.setTimeout(() => {
        hideTimer = null
        if (!Boolean(toValue(source))) {
          hide()
        }
      }, remaining)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    clearShowTimer()
    clearHideTimer()
  })

  return isVisible
}
