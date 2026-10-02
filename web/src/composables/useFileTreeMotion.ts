import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import {
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  watch,
  type InjectionKey,
  type Ref,
} from 'vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { readCssCubicBezier, readCssLengthPx, readCssTimeMs } from '@/utils/css'
import {
  planFileTreeMotion,
  type TreeMotionTiming,
  type TreeRowLayout,
} from '@/utils/file-tree-motion'

gsap.registerPlugin(CustomEase)

interface FileTreeMotionContext {
  beforeLayoutChange: (directory: string) => void
}

interface RowSnapshot extends TreeRowLayout {
  element: HTMLElement
  opacity: number
}

interface LayoutSnapshot {
  rows: Map<string, RowSnapshot>
  contentHeight: number
}

const fileTreeMotionKey: InjectionKey<FileTreeMotionContext> = Symbol('file-tree-motion')
const leavingSelector = '.tree-branch-leave-active, .file-tree-state-swap-leave-active'
const enteringSelector = '.tree-branch-enter-active, .file-tree-state-swap-enter-active'
const enteringFromSelector = '.tree-branch-enter-from, .file-tree-state-swap-enter-from'
const contentHeightOf = (layout: HTMLElement) => (
  (layout.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0
)

export const provideFileTreeMotion = (
  rootRef: Ref<HTMLElement | null>,
  layoutRef: Ref<HTMLElement | null>,
) => {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const timing: TreeMotionTiming = {
    duration: readCssTimeMs('--motion-tree-duration', 0),
    minDuration: readCssTimeMs('--motion-tree-resize-duration-min', 0),
    maxDuration: readCssTimeMs('--motion-tree-resize-duration-max', 0),
    referenceDistance: Math.max(readCssLengthPx('--motion-tree-resize-reference-distance', 1), 1),
  }
  const [x1, y1, x2, y2] = readCssCubicBezier('--motion-tree-easing', [0, 0, 1, 1])
  const ease = CustomEase.create('', `M0,0 C${x1},${y1} ${x2},${y2} 1,1`)
  const changedDirectories = new Set<string>()
  let snapshot: LayoutSnapshot | null = null
  let timeline: gsap.core.Timeline | null = null
  const animatedRows = new Set<HTMLElement>()
  let disposed = false

  const measureRows = (root: HTMLElement) => {
    const origin = root.getBoundingClientRect().top - root.scrollTop
    const rows = new Map<string, RowSnapshot>()
    for (const element of root.querySelectorAll<HTMLElement>('[data-tree-node-path]')) {
      if (element.closest(leavingSelector)) {
        continue
      }
      const bounds = element.getBoundingClientRect()
      const path = element.dataset.treeNodePath!
      const visualTop = bounds.top - origin
      rows.set(path, {
        path,
        element,
        visualTop,
        top: visualTop - (animatedRows.has(element) ? Number(gsap.getProperty(element, 'y')) : 0),
        height: bounds.height,
        opacity: animatedRows.has(element) ? Number(gsap.getProperty(element, 'opacity')) : 1,
      })
    }
    return rows
  }

  const stop = () => {
    timeline?.kill()
    timeline = null
    // Outgoing branches retain their current pose until Vue finishes removing them.
    const connected = [...animatedRows].filter((row) => row.isConnected && !row.closest(leavingSelector))
    if (connected.length) {
      gsap.set(connected, { clearProps: 'transform,opacity' })
    }
    animatedRows.clear()
  }

  const releaseScrollExtent = () => layoutRef.value?.style.removeProperty('min-height')

  const play = () => {
    const previous = snapshot
    snapshot = null
    const root = rootRef.value
    const layout = layoutRef.value
    if (disposed || !previous || !root || !layout || reducedMotion.value) {
      changedDirectories.clear()
      releaseScrollExtent()
      return
    }

    const before = previous.rows
    const after = measureRows(root)
    const contentHeight = contentHeightOf(layout)
    const plan = planFileTreeMotion(
      before, after, changedDirectories, timing, 1 / window.devicePixelRatio, ease,
      contentHeight - previous.contentHeight,
    )
    changedDirectories.clear()
    if (!plan) {
      if (!timeline) {
        releaseScrollExtent()
      }
      return
    }

    const entranceDuration = plan.curves[0]!.duration
    // Vue starts the opacity transition on its next animation frame. Give only
    // new entrances this plan's timing, without retiming an ancestor already fading.
    for (const element of root.querySelectorAll<HTMLElement>(enteringFromSelector)) {
      if (!element.closest(leavingSelector)) {
        element.style.setProperty('--motion-tree-enter-duration', `${entranceDuration}ms`)
      }
    }
    const scrollTop = Math.min(root.scrollTop, Math.max(0, contentHeight - root.clientHeight))
    // A newly mounted branch/gate owns its whole subtree's entrance. Only isolated
    // insertions into an already visible list need a row-level fade.
    const entering = [...after.values()].filter((row) => (
      !row.element.closest(enteringSelector)
      && (!before.has(row.path) || before.get(row.path)!.opacity < 1)
    ))
    stop()
    if (plan.duration <= 0 || (!plan.rows.length && !entering.length && scrollTop === root.scrollTop)) {
      releaseScrollExtent()
      return
    }

    const groups = new Map<number, typeof plan.rows>()
    for (const row of plan.rows) {
      const group = groups.get(row.level) ?? []
      group.push(row)
      groups.set(row.level, group)
    }

    timeline = gsap.timeline({
      onComplete: () => {
        stop()
        releaseScrollExtent()
      },
    })
    for (const [level, group] of groups) {
      const curve = plan.curves[level]!
      const elements = group.map((row) => after.get(row.path)!.element)
      elements.forEach((element) => animatedRows.add(element))
      gsap.set(elements, { y: (index) => group[index]!.offset })
      timeline.to(elements, { y: 0, duration: curve.duration / 1000, ease: curve.ease }, 0)
    }
    if (entering.length) {
      const elements = entering.map((row) => row.element)
      elements.forEach((element) => animatedRows.add(element))
      gsap.set(elements, { opacity: (index) => before.get(entering[index]!.path)?.opacity ?? 0 })
      timeline.to(elements, { opacity: 1, duration: entranceDuration / 1000, ease }, 0)
    }
    if (scrollTop !== root.scrollTop) {
      timeline.to(root, { scrollTop, duration: plan.duration / 1000, ease }, 0)
    }
  }

  const beforeLayoutChange = (directory: string) => {
    const root = rootRef.value
    const layout = layoutRef.value
    if (disposed || reducedMotion.value || !root || !layout) {
      return
    }
    changedDirectories.add(directory)
    if (snapshot) {
      return
    }
    snapshot = { rows: measureRows(root), contentHeight: contentHeightOf(layout) }
    // Reserve the scroll range, not animated height. It is released at the final layout.
    const height = layout.offsetHeight
    layout.style.minHeight = `${height}px`
    // Called from pre-flush watchers or the gate, before Vue patches the affected subtree.
    void nextTick(play)
  }

  const interruptScroll = () => {
    if (rootRef.value) {
      gsap.killTweensOf(rootRef.value, 'scrollTop')
    }
  }

  const context = { beforeLayoutChange }
  provide(fileTreeMotionKey, context)
  onMounted(() => {
    rootRef.value?.addEventListener('wheel', interruptScroll, { passive: true })
    rootRef.value?.addEventListener('touchstart', interruptScroll, { passive: true })
    rootRef.value?.addEventListener('dragstart', interruptScroll)
  })
  watch(reducedMotion, (reduced) => {
    if (reduced) {
      stop()
      releaseScrollExtent()
    }
  })
  onBeforeUnmount(() => {
    disposed = true
    rootRef.value?.removeEventListener('wheel', interruptScroll)
    rootRef.value?.removeEventListener('touchstart', interruptScroll)
    rootRef.value?.removeEventListener('dragstart', interruptScroll)
    stop()
    snapshot = null
    changedDirectories.clear()
    releaseScrollExtent()
  })
  return context
}

export const useFileTreeMotion = (): FileTreeMotionContext => {
  const context = inject(fileTreeMotionKey)
  if (!context) {
    throw new Error('File tree motion context is unavailable')
  }
  return context
}
