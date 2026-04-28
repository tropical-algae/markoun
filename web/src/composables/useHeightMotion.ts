import gsap from 'gsap'
import { onBeforeUnmount, type Ref } from 'vue'
import { readRootCssNumber } from '@/utils/css-vars'

export interface UseHeightMotionOptions {
  duration?: number
  enterEase?: string
  leaveEase?: string
}

export const useHeightMotion = (
  panelRef: Ref<HTMLElement | null>,
  contentRef: Ref<HTMLElement | null>,
  options: UseHeightMotionOptions = {},
) => {
  const duration = options.duration ?? readRootCssNumber('--motion-height-duration', 0.4)
  const enterEase = options.enterEase ?? 'power2.out'
  const leaveEase = options.leaveEase ?? 'power2.inOut'
  let resizeObserver: ResizeObserver | null = null

  const disconnectResizeObserver = () => {
    resizeObserver?.disconnect()
    resizeObserver = null
  }

  const animateHeightToContent = () => {
    const panel = panelRef.value
    const content = contentRef.value
    if (!panel || !content) {
      return
    }

    const nextHeight = content.scrollHeight
    const currentHeight = panel.offsetHeight || nextHeight
    if (Math.abs(currentHeight - nextHeight) < 1) {
      panel.style.height = `${nextHeight}px`
      return
    }

    gsap.killTweensOf(panel)
    gsap.set(panel, { height: currentHeight })
    gsap.to(panel, {
      height: nextHeight,
      duration,
      ease: enterEase,
      overwrite: 'auto',
    })
  }

  const connectResizeObserver = (shouldAnimate: () => boolean = () => true) => {
    disconnectResizeObserver()
    if (!panelRef.value || !contentRef.value) {
      return
    }

    panelRef.value.style.height = `${contentRef.value.scrollHeight}px`
    resizeObserver = new ResizeObserver(() => {
      if (shouldAnimate()) {
        animateHeightToContent()
      }
    })
    resizeObserver.observe(contentRef.value)
  }

  const enter = (element: Element, done: () => void) => {
    const panel = element as HTMLElement
    const content = panel.firstElementChild as HTMLElement | null
    const nextHeight = content?.scrollHeight ?? panel.scrollHeight

    gsap.killTweensOf(panel)
    gsap.set(panel, { height: 0 })
    gsap.to(panel, {
      height: nextHeight,
      duration,
      ease: enterEase,
      overwrite: 'auto',
      onComplete: () => {
        panel.style.height = `${content?.scrollHeight ?? nextHeight}px`
        done()
      },
    })
  }

  const leave = (element: Element, done: () => void) => {
    const panel = element as HTMLElement
    disconnectResizeObserver()

    gsap.killTweensOf(panel)
    gsap.set(panel, { height: panel.offsetHeight })
    gsap.to(panel, {
      height: 0,
      duration,
      ease: leaveEase,
      overwrite: 'auto',
      onComplete: done,
    })
  }

  onBeforeUnmount(() => {
    disconnectResizeObserver()
    if (panelRef.value) {
      gsap.killTweensOf(panelRef.value)
    }
  })

  return {
    connectResizeObserver,
    disconnectResizeObserver,
    animateHeightToContent,
    enter,
    leave,
  }
}
