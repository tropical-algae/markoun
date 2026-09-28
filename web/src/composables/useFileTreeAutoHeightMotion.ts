import { onBeforeUnmount, ref, watch, type ComponentPublicInstance } from 'vue'
import { useFileTreeMotion } from '@/composables/useFileTreeMotion'

const getObservedHeight = (entry: ResizeObserverEntry): number => {
  const borderBoxSize = entry.borderBoxSize
  const box = Array.isArray(borderBoxSize) ? borderBoxSize[0] : borderBoxSize
  return box?.blockSize ?? entry.target.getBoundingClientRect().height
}

export const useFileTreeAutoHeightMotion = () => {
  const treeMotion = useFileTreeMotion()
  const shellRef = ref<HTMLElement | null>(null)
  const contentRef = ref<HTMLElement | null>(null)
  let resizeObserver: ResizeObserver | null = null
  let heightAnimation: Animation | null = null
  let lastContentHeight: number | null = null

  const disposeHeightAnimation = (animation: Animation) => {
    animation.onfinish = null
    animation.oncancel = null
    animation.cancel()
    animation.effect = null
  }

  const clearHeightAnimation = () => {
    const animation = heightAnimation
    heightAnimation = null
    if (animation) {
      disposeHeightAnimation(animation)
    }
    shellRef.value?.style.removeProperty('height')
  }

  const finishAnimation = (animation: Animation) => {
    if (heightAnimation !== animation) {
      return
    }
    clearHeightAnimation()
  }

  const retargetHeightAnimation = (
    animation: Animation,
    startHeight: number,
    targetHeight: number,
    duration: number,
  ): boolean => {
    if (!(animation.effect instanceof KeyframeEffect)) {
      return false
    }
    animation.effect.setKeyframes([
      { height: `${startHeight}px` },
      { height: `${targetHeight}px` },
    ])
    animation.effect.updateTiming({
      duration,
      easing: treeMotion.resizeEasing,
      fill: 'forwards',
    })
    animation.currentTime = 0
    animation.play()
    return true
  }

  const animateToHeight = (targetHeight: number) => {
    const shell = shellRef.value
    if (!shell || lastContentHeight === null) {
      lastContentHeight = targetHeight
      return
    }

    const startHeight = heightAnimation
      ? shell.getBoundingClientRect().height
      : lastContentHeight
    lastContentHeight = targetHeight

    const distance = Math.abs(targetHeight - startHeight)
    if (distance < 0.5 || treeMotion.shouldReduceMotion()) {
      clearHeightAnimation()
      return
    }

    const duration = treeMotion.resolveResizeDurationMs(distance)
    if (
      heightAnimation
      && retargetHeightAnimation(
        heightAnimation,
        startHeight,
        targetHeight,
        duration,
      )
    ) {
      return
    }

    clearHeightAnimation()
    const animation = shell.animate(
      [
        { height: `${startHeight}px` },
        { height: `${targetHeight}px` },
      ],
      {
        duration,
        easing: treeMotion.resizeEasing,
        fill: 'forwards',
      },
    )
    heightAnimation = animation
    animation.onfinish = () => finishAnimation(animation)
  }

  watch(contentRef, (content, previousContent) => {
    if (previousContent) {
      resizeObserver?.unobserve(previousContent)
    }
    clearHeightAnimation()
    lastContentHeight = null
    if (content) {
      resizeObserver ??= new ResizeObserver(([entry]) => {
        if (entry) {
          animateToHeight(getObservedHeight(entry))
        }
      })
      resizeObserver.observe(content)
    } else {
      resizeObserver?.disconnect()
      resizeObserver = null
    }
  }, { flush: 'post' })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
    clearHeightAnimation()
    lastContentHeight = null
    contentRef.value = null
    shellRef.value = null
  })

  const setShellRef = (element: Element | ComponentPublicInstance | null) => {
    shellRef.value = element instanceof HTMLElement ? element : null
  }

  const setContentRef = (element: Element | ComponentPublicInstance | null) => {
    contentRef.value = element instanceof HTMLElement ? element : null
  }

  return {
    setShellRef,
    setContentRef,
  }
}
