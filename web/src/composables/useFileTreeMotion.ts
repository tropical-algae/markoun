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
  readCssTimeMs,
} from '@/utils/css'

type MotionState = false | Record<string, string | number>

interface FileTreeMotionContext {
  itemInitial: ComputedRef<MotionState>
  itemVisible: ComputedRef<Record<string, string | number>>
  transition: ComputedRef<Record<string, unknown>>
}

const fileTreeMotionKey: InjectionKey<FileTreeMotionContext> = Symbol('file-tree-motion')

export const provideFileTreeMotion = (): FileTreeMotionContext => {
  const reducedMotion = useReducedMotion()
  const duration = readCssTimeMs('--motion-tree-duration', 0) / 1000
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
