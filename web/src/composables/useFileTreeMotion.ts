import {
  inject,
  provide,
  type InjectionKey,
} from 'vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import {
  readCssCubicBezier,
  readCssLengthPx,
  readCssTimeMs,
} from '@/utils/css'

interface FileTreeMotionContext {
  resizeEasing: string
  resolveResizeDurationMs: (distancePx: number) => number
  shouldReduceMotion: () => boolean
}

const fileTreeMotionKey: InjectionKey<FileTreeMotionContext> = Symbol('file-tree-motion')

export const provideFileTreeMotion = (): FileTreeMotionContext => {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const durationMs = readCssTimeMs('--motion-tree-duration', 0)
  const minResizeDurationMs = readCssTimeMs('--motion-tree-resize-duration-min', 0)
  const maxResizeDurationMs = readCssTimeMs(
    '--motion-tree-resize-duration-max',
    durationMs,
  )
  const resizeReferenceDistance = Math.max(
    readCssLengthPx('--motion-tree-resize-reference-distance', 1),
    1,
  )
  const ease = readCssCubicBezier('--motion-tree-easing', [0, 0, 1, 1])
  const resizeEasing = `cubic-bezier(${ease.join(',')})`

  const resolveResizeDurationMs = (distancePx: number) => {
    const minDuration = Math.min(minResizeDurationMs, maxResizeDurationMs)
    const maxDuration = Math.max(minResizeDurationMs, maxResizeDurationMs)
    const scaledDuration = durationMs
      * Math.sqrt(Math.max(distancePx, 0) / resizeReferenceDistance)

    return Math.min(Math.max(scaledDuration, minDuration), maxDuration)
  }

  const context: FileTreeMotionContext = {
    resizeEasing,
    resolveResizeDurationMs,
    shouldReduceMotion: () => Boolean(reducedMotion.value),
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
