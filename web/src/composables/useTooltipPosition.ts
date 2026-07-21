import { ref, type CSSProperties, type Ref } from 'vue'
import { readCssLengthPx } from '@/utils/css'

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

type TooltipStyle = CSSProperties & { '--tooltip-arrow-offset'?: string }

const clamp = (value: number, min: number, max: number) => {
  if (max < min) {
    return min
  }

  return Math.min(Math.max(value, min), max)
}

const getViewportBounds = () => {
  const viewport = window.visualViewport
  const left = viewport?.offsetLeft ?? 0
  const top = viewport?.offsetTop ?? 0

  return {
    left,
    top,
    right: left + (viewport?.width ?? window.innerWidth),
    bottom: top + (viewport?.height ?? window.innerHeight),
  }
}

export const useTooltipPosition = (
  anchorRef: Ref<HTMLElement | null>,
  bubbleRef: Ref<HTMLElement | null>,
  getPlacement: () => TooltipPlacement,
) => {
  const tooltipStyle = ref<TooltipStyle>({
    left: '0px',
    top: '0px',
  })
  let hasPositionListeners = false

  const updateTooltipPosition = () => {
    const anchor = anchorRef.value
    const bubble = bubbleRef.value
    if (!anchor || !bubble) {
      return
    }

    const rect = anchor.getBoundingClientRect()
    const bubbleWidth = bubble.offsetWidth
    const bubbleHeight = bubble.offsetHeight
    const gap = readCssLengthPx('--space-sm', 8)
    const padding = readCssLengthPx('--space-sm', 8)
    const arrowSize = readCssLengthPx('--tooltip-arrow-size', 7)
    const viewport = getViewportBounds()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const minLeft = viewport.left + padding
    const maxLeft = viewport.right - padding - bubbleWidth
    const minTop = viewport.top + padding
    const maxTop = viewport.bottom - padding - bubbleHeight
    const placement = getPlacement()
    let left = centerX - bubbleWidth / 2
    let top = rect.top - gap - bubbleHeight
    let arrowOffset = centerX - left

    if (placement === 'right') {
      left = rect.right + gap
      top = centerY - bubbleHeight / 2
      left = clamp(left, minLeft, maxLeft)
      top = clamp(top, minTop, maxTop)
      arrowOffset = centerY - top
    } else if (placement === 'bottom') {
      left = centerX - bubbleWidth / 2
      top = rect.bottom + gap
      left = clamp(left, minLeft, maxLeft)
      top = clamp(top, minTop, maxTop)
      arrowOffset = centerX - left
    } else if (placement === 'left') {
      left = rect.left - gap - bubbleWidth
      top = centerY - bubbleHeight / 2
      left = clamp(left, minLeft, maxLeft)
      top = clamp(top, minTop, maxTop)
      arrowOffset = centerY - top
    } else {
      left = clamp(left, minLeft, maxLeft)
      top = clamp(top, minTop, maxTop)
      arrowOffset = centerX - left
    }

    const maxArrowOffset = placement === 'top' || placement === 'bottom'
      ? bubbleWidth - arrowSize / 2
      : bubbleHeight - arrowSize / 2
    tooltipStyle.value = {
      left: `${left}px`,
      top: `${top}px`,
      '--tooltip-arrow-offset': `${clamp(arrowOffset, arrowSize / 2, maxArrowOffset)}px`,
    }
  }

  const addPositionListeners = () => {
    if (hasPositionListeners) {
      return
    }

    window.addEventListener('resize', updateTooltipPosition)
    window.addEventListener('scroll', updateTooltipPosition, true)
    hasPositionListeners = true
  }

  const removePositionListeners = () => {
    if (!hasPositionListeners) {
      return
    }

    window.removeEventListener('resize', updateTooltipPosition)
    window.removeEventListener('scroll', updateTooltipPosition, true)
    hasPositionListeners = false
  }

  return {
    tooltipStyle,
    updateTooltipPosition,
    addPositionListeners,
    removePositionListeners,
  }
}
