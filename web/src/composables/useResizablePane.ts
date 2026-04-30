import { computed, onBeforeUnmount, ref, type Ref } from 'vue'

type ResizeDirection = 'left' | 'right'

export interface UseResizablePaneOptions {
  initialWidth: number
  minWidth: number
  maxWidth: number
  direction: ResizeDirection
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

export const useResizablePane = (options: UseResizablePaneOptions) => {
  const width = ref(options.initialWidth)
  const isResizing = ref(false)

  let removeListeners: (() => void) | null = null

  const stopResizing = () => {
    isResizing.value = false
    removeListeners?.()
    removeListeners = null
  }

  const startResizing = (event: MouseEvent) => {
    stopResizing()

    isResizing.value = true
    const startX = event.clientX
    const startWidth = width.value

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.value) {
        return
      }

      const deltaX = options.direction === 'right'
        ? moveEvent.clientX - startX
        : startX - moveEvent.clientX
      width.value = clamp(startWidth + deltaX, options.minWidth, options.maxWidth)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', stopResizing)

    removeListeners = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', stopResizing)
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
