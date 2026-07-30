import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  type CSSProperties,
  type Ref,
} from 'vue'
import { DEFAULT_VIEWPORT_WIDTH } from '@/constants/layout'
import { readCssNumber } from '@/utils/css'

export type WorkspacePaneSide = 'left' | 'right'

interface UseWorkspacePaneResizeOptions {
  leftOpen: Readonly<Ref<boolean>>
  rightOpen: Readonly<Ref<boolean>>
  isCompact: Readonly<Ref<boolean>>
}

interface ActiveResize {
  pointerId: number
  side: WorkspacePaneSide
  startX: number
  startWidth: number
  target: HTMLElement
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, Math.min(min, max)), max)
}

export const useWorkspacePaneResize = ({
  leftOpen,
  rightOpen,
  isCompact,
}: UseWorkspacePaneResizeOptions) => {
  const stageRef = ref<HTMLElement | null>(null)
  const stageWidth = ref(DEFAULT_VIEWPORT_WIDTH)
  const leftPreferredWidth = ref(
    readCssNumber('--layout-sidebar-width-default', 250),
  )
  const rightPreferredWidth = ref(
    readCssNumber('--layout-inspector-width-default', 250),
  )
  const leftMinWidth = readCssNumber('--layout-sidebar-width-min', 240)
  const leftMaxWidth = readCssNumber('--layout-sidebar-width-max', 500)
  const rightMinWidth = readCssNumber('--layout-inspector-width-min', 200)
  const rightMaxWidth = readCssNumber('--layout-inspector-width-max', 700)
  const editorMinWidth = readCssNumber('--layout-editor-width-min', 280)
  const resizeStep = readCssNumber('--layout-pane-resize-step', 10)

  const effectiveWidths = computed(() => {
    const preferredLeft = clamp(
      leftPreferredWidth.value,
      leftMinWidth,
      leftMaxWidth,
    )
    const preferredRight = clamp(
      rightPreferredWidth.value,
      rightMinWidth,
      rightMaxWidth,
    )
    const requestedLeft = leftOpen.value ? preferredLeft : 0
    const requestedRight = rightOpen.value ? preferredRight : 0
    const availableWidth = Math.max(0, stageWidth.value - editorMinWidth)
    const requestedTotal = requestedLeft + requestedRight

    if (requestedTotal <= availableWidth || requestedTotal === 0) {
      return {
        left: requestedLeft,
        right: requestedRight,
        leftPane: leftOpen.value ? requestedLeft : preferredLeft,
        rightPane: rightOpen.value ? requestedRight : preferredRight,
      }
    }

    const minimumLeft = leftOpen.value ? leftMinWidth : 0
    const minimumRight = rightOpen.value ? rightMinWidth : 0
    const minimumTotal = minimumLeft + minimumRight

    if (minimumTotal >= availableWidth) {
      const leftRatio = minimumTotal === 0 ? 0 : minimumLeft / minimumTotal
      const left = availableWidth * leftRatio
      const right = availableWidth * (1 - leftRatio)
      return {
        left,
        right,
        leftPane: leftOpen.value ? left : preferredLeft,
        rightPane: rightOpen.value ? right : preferredRight,
      }
    }

    const remainingWidth = availableWidth - minimumTotal
    const leftExtra = requestedLeft - minimumLeft
    const rightExtra = requestedRight - minimumRight
    const extraTotal = leftExtra + rightExtra
    const leftExtraRatio = extraTotal === 0 ? 0 : leftExtra / extraTotal
    const left = minimumLeft + remainingWidth * leftExtraRatio
    const right = minimumRight + remainingWidth * (1 - leftExtraRatio)

    return {
      left,
      right,
      leftPane: leftOpen.value ? left : preferredLeft,
      rightPane: rightOpen.value ? right : preferredRight,
    }
  })

  const stageStyle = computed<CSSProperties>(() => ({
    '--workspace-left-pane-width': `${effectiveWidths.value.leftPane}px`,
    '--workspace-left-pane-reveal': `${effectiveWidths.value.left}px`,
    '--workspace-right-pane-width': `${effectiveWidths.value.rightPane}px`,
    '--workspace-right-pane-reveal': `${effectiveWidths.value.right}px`,
  }))

  const activeResize = ref<ActiveResize | null>(null)
  let pendingClientX: number | null = null
  let resizeFrame: number | null = null
  let stageResizeObserver: ResizeObserver | null = null

  const availablePaneMax = (side: WorkspacePaneSide) => {
    const otherWidth = side === 'left'
      ? effectiveWidths.value.right
      : effectiveWidths.value.left
    const configuredMax = side === 'left' ? leftMaxWidth : rightMaxWidth
    return Math.max(0, Math.min(
      configuredMax,
      stageWidth.value - editorMinWidth - otherWidth,
    ))
  }

  const updatePreferredWidth = (side: WorkspacePaneSide, width: number) => {
    const minWidth = side === 'left' ? leftMinWidth : rightMinWidth
    const nextWidth = clamp(width, minWidth, availablePaneMax(side))
    if (side === 'left') {
      leftPreferredWidth.value = nextWidth
    } else {
      rightPreferredWidth.value = nextWidth
    }
  }

  const applyResize = () => {
    resizeFrame = null
    const resize = activeResize.value
    if (!resize || pendingClientX === null) {
      return
    }

    const delta = resize.side === 'left'
      ? pendingClientX - resize.startX
      : resize.startX - pendingClientX
    updatePreferredWidth(resize.side, resize.startWidth + delta)
  }

  const startResize = (side: WorkspacePaneSide, event: PointerEvent) => {
    if (
      isCompact.value
      || event.button !== 0
      || (side === 'left' ? !leftOpen.value : !rightOpen.value)
    ) {
      return
    }

    const target = event.currentTarget
    if (!(target instanceof HTMLElement)) {
      return
    }

    event.preventDefault()
    target.setPointerCapture(event.pointerId)
    activeResize.value = {
      pointerId: event.pointerId,
      side,
      startX: event.clientX,
      startWidth: side === 'left'
        ? effectiveWidths.value.left
        : effectiveWidths.value.right,
      target,
    }
  }

  const continueResize = (event: PointerEvent) => {
    if (event.pointerId !== activeResize.value?.pointerId) {
      return
    }

    pendingClientX = event.clientX
    if (resizeFrame === null) {
      resizeFrame = window.requestAnimationFrame(applyResize)
    }
  }

  const stopResize = (event?: PointerEvent) => {
    const resize = activeResize.value
    if (!resize || (event && event.pointerId !== resize.pointerId)) {
      return
    }

    if (resizeFrame !== null) {
      window.cancelAnimationFrame(resizeFrame)
      resizeFrame = null
    }
    if (pendingClientX !== null) {
      applyResize()
    }
    activeResize.value = null
    if (resize.target.hasPointerCapture(resize.pointerId)) {
      resize.target.releasePointerCapture(resize.pointerId)
    }
    pendingClientX = null
  }

  const resizeWithKeyboard = (
    side: WorkspacePaneSide,
    event: KeyboardEvent,
  ) => {
    const direction = side === 'left'
      ? { ArrowLeft: -1, ArrowRight: 1 }
      : { ArrowLeft: 1, ArrowRight: -1 }
    const multiplier = direction[event.key as keyof typeof direction]
    if (multiplier === undefined) {
      return
    }

    event.preventDefault()
    const currentWidth = side === 'left'
      ? effectiveWidths.value.left
      : effectiveWidths.value.right
    updatePreferredWidth(side, currentWidth + resizeStep * multiplier)
  }

  onMounted(() => {
    if (!stageRef.value) {
      return
    }

    stageWidth.value = stageRef.value.getBoundingClientRect().width
    stageResizeObserver = new ResizeObserver(([entry]) => {
      if (entry) {
        stageWidth.value = entry.contentRect.width
      }
    })
    stageResizeObserver.observe(stageRef.value)
  })

  onBeforeUnmount(() => {
    stopResize()
    stageResizeObserver?.disconnect()
  })

  return {
    activeResize,
    continueResize,
    effectiveWidths,
    leftMaxWidth,
    leftMinWidth,
    resizeWithKeyboard,
    rightMaxWidth,
    rightMinWidth,
    stageRef,
    stageStyle,
    startResize,
    stopResize,
  }
}
