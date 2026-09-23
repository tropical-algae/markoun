import { onBeforeUnmount, ref, watch, type ComponentPublicInstance } from 'vue'
import { readCssCubicBezier, readCssTimeMs } from '@/utils/css'

const TREE_EASING_FALLBACK: [number, number, number, number] = [0, 0, 1, 1]

const getObservedHeight = (entry: ResizeObserverEntry): number => {
  const borderBoxSize = entry.borderBoxSize
  const box = Array.isArray(borderBoxSize) ? borderBoxSize[0] : borderBoxSize
  return box?.blockSize ?? entry.target.getBoundingClientRect().height
}

export const useAutoHeightMotion = () => {
  const shellRef = ref<HTMLElement | null>(null)
  const contentRef = ref<HTMLElement | null>(null)
  let resizeObserver: ResizeObserver | null = null
  let heightAnimation: Animation | null = null
  let lastContentHeight: number | null = null

  const finishAnimation = (animation: Animation, targetHeight: number) => {
    if (heightAnimation !== animation || !shellRef.value) {
      return
    }
    shellRef.value.style.height = `${targetHeight}px`
    animation.cancel()
    shellRef.value.style.removeProperty('height')
    heightAnimation = null
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
    heightAnimation?.cancel()
    heightAnimation = null

    if (
      Math.abs(startHeight - targetHeight) < 0.5
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      shell.style.removeProperty('height')
      return
    }

    const easing = readCssCubicBezier('--motion-tree-easing', TREE_EASING_FALLBACK)
    const animation = shell.animate(
      [
        { height: `${startHeight}px` },
        { height: `${targetHeight}px` },
      ],
      {
        duration: readCssTimeMs('--motion-tree-duration', 0),
        easing: `cubic-bezier(${easing.join(',')})`,
        fill: 'forwards',
      },
    )
    heightAnimation = animation
    void animation.finished
      .then(() => finishAnimation(animation, targetHeight))
      .catch(() => null)
  }

  watch(contentRef, (content, previousContent) => {
    if (previousContent) {
      resizeObserver?.unobserve(previousContent)
    }
    heightAnimation?.cancel()
    heightAnimation = null
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
    heightAnimation?.cancel()
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
