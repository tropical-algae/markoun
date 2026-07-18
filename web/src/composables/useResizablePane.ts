import { computed, onBeforeUnmount, ref, type Ref } from 'vue'

export type ResizeDirection = 'left' | 'right'

export interface UseResizablePaneOptions {
  initialWidth: number
  minWidth: number
  maxWidth: number
  direction: ResizeDirection
}

const clamp = (value: number, min: number, max: number) => {
  if (max < min) {
    return min
  }

  return Math.min(Math.max(value, min), max)
}

export const useResizablePane = (options: UseResizablePaneOptions) => {
  const width = ref(clamp(options.initialWidth, options.minWidth, options.maxWidth))
  const isResizing = ref(false)

  let removeListeners: (() => void) | null = null

  const stopResizing = () => {
    isResizing.value = false
    removeListeners?.()
    removeListeners = null
  }

  const startResizing = (event: PointerEvent) => {
    stopResizing()

    isResizing.value = true
    const startX = event.clientX
    const startWidth = width.value

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isResizing.value) {
        return
      }

      const deltaX = options.direction === 'right'
        ? moveEvent.clientX - startX
        : startX - moveEvent.clientX
      width.value = clamp(startWidth + deltaX, options.minWidth, options.maxWidth)
    }

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', stopResizing)
    document.addEventListener('pointercancel', stopResizing)

    removeListeners = () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', stopResizing)
      document.removeEventListener('pointercancel', stopResizing)
    }
  }

  const visibleWidth = (isVisible: Ref<boolean>) => {
    return computed(() => (isVisible.value ? `${width.value}px` : '0px'))
  }

  onBeforeUnmount(stopResizing)

  return {
    width,
    isResizing,
    startResizing,
    visibleWidth,
  }
}
