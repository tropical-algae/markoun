import { computed, type CSSProperties, type Ref } from 'vue'
import { useResizablePane, type ResizeDirection } from '@/composables/useResizablePane'
import { readCssNumber } from '@/utils/css'
import { useWorkspaceLayout } from '@/layouts/workspace-context'

interface CssNumberToken {
  name: string
  fallback: number
}

interface UseResponsivePaneOptions {
  visible: Readonly<Ref<boolean>>
  initialWidth: CssNumberToken
  minWidth: CssNumberToken
  maxWidth: CssNumberToken
  direction: ResizeDirection
}

export const useResponsivePane = (options: UseResponsivePaneOptions) => {
  const { isCompactLayout } = useWorkspaceLayout()
  const {
    width,
    isResizing,
    startResizing,
    visibleWidth,
  } = useResizablePane({
    initialWidth: readCssNumber(
      options.initialWidth.name,
      options.initialWidth.fallback,
    ),
    minWidth: readCssNumber(options.minWidth.name, options.minWidth.fallback),
    maxWidth: readCssNumber(options.maxWidth.name, options.maxWidth.fallback),
    direction: options.direction,
  })

  const currentWidth = visibleWidth(options.visible)
  const wrapperStyle = computed<CSSProperties>(() =>
    isCompactLayout.value ? {} : { width: currentWidth.value }
  )
  const contentStyle = computed<CSSProperties>(() =>
    isCompactLayout.value ? {} : { width: `${width.value}px` }
  )

  return {
    isCompactLayout,
    isResizing,
    startResizing,
    wrapperStyle,
    contentStyle,
  }
}
