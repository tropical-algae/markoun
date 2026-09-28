import {
  computed,
  inject,
  provide,
  type ComputedRef,
  type InjectionKey,
} from 'vue'
import { useReducedMotion } from 'motion-v'
import {
  readCssCubicBezier,
  readCssLengthPx,
  readCssNumber,
  readCssTimeMs,
} from '@/utils/css'

type MotionState = false | Record<string, string | number>

interface FileTreeMotionContext {
  itemInitial: ComputedRef<MotionState>
  itemVisible: ComputedRef<Record<string, string | number>>
  transition: ComputedRef<Record<string, unknown>>
}

const fileTreeMotionKey: InjectionKey<FileTreeMotionContext> = Symbol('file-tree-motion')

interface FileTreeMotionTiming {
  durationMs: number
  minDurationMs: number
  maxDurationMs: number
  referenceDistancePx: number
}

let motionTiming: FileTreeMotionTiming | null = null

const getFileTreeMotionTiming = (): FileTreeMotionTiming => {
  motionTiming ??= {
    durationMs: readCssTimeMs('--motion-tree-duration', 420),
    minDurationMs: readCssTimeMs('--motion-tree-duration-min', 240),
    maxDurationMs: readCssTimeMs('--motion-tree-duration-max', 680),
    referenceDistancePx: readCssNumber('--motion-tree-reference-distance-px', 160),
  }
  return motionTiming
}

export const resolveFileTreeMotionDurationMs = (distancePx: number): number => {
  const timing = getFileTreeMotionTiming()
  const minDuration = Math.min(timing.minDurationMs, timing.maxDurationMs)
  const maxDuration = Math.max(timing.minDurationMs, timing.maxDurationMs)
  const referenceDistance = Math.max(timing.referenceDistancePx, 1)
  const scaledDuration = timing.durationMs
    * Math.sqrt(Math.max(distancePx, 0) / referenceDistance)

  return Math.min(Math.max(scaledDuration, minDuration), maxDuration)
}

export const provideFileTreeMotion = (): FileTreeMotionContext => {
  const reducedMotion = useReducedMotion()
  const duration = getFileTreeMotionTiming().durationMs / 1000
  const ease = readCssCubicBezier('--motion-tree-easing', [0, 0, 1, 1])
  const offsetY = readCssLengthPx('--motion-tree-offset-y', 0)

  const transition = computed(() => ({
    type: 'tween',
    duration: reducedMotion.value ? 0 : duration,
    ease,
  }))
  const itemInitial = computed<MotionState>(() => (
    reducedMotion.value ? false : { opacity: 0, y: offsetY }
  ))
  const itemVisible = computed(() => ({ opacity: 1, y: 0 }))

  const context: FileTreeMotionContext = {
    itemInitial,
    itemVisible,
    transition,
  }
  provide(fileTreeMotionKey, context)
  return context
}

export const useFileTreeMotion = (): FileTreeMotionContext => {
  const context = inject(fileTreeMotionKey)
  if (!context) {
    throw new Error('File tree motion context is unavailable')
  }
  return context
}
