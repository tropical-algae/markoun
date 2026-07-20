import { computed, ref } from 'vue'
import { useViewportSize } from '@/composables/useViewportSize'
import { readCssNumber } from '@/utils/css'

export const useImagePreviewSize = () => {
  const viewportSize = useViewportSize()
  const naturalWidth = ref(0)
  const naturalHeight = ref(0)

  const sizeConfig = computed(() => ({
    defaultWidth: readCssNumber('--image-preview-default-width', 640),
    defaultHeight: readCssNumber('--image-preview-default-height', 420),
    minWidth: readCssNumber('--image-preview-min-width', 280),
    maxWidth: readCssNumber('--image-preview-max-width', 720),
    minStageWidth: readCssNumber('--image-preview-min-stage-width', 220),
    minStageHeight: readCssNumber('--image-preview-min-stage-height', 180),
    viewportWidthRatio: readCssNumber('--image-preview-viewport-width-ratio', 0.82),
    viewportHeightRatio: readCssNumber('--image-preview-viewport-height-ratio', 0.72),
  }))

  const fitImageSize = (width: number, height: number) => {
    const config = sizeConfig.value
    const maxWidth = Math.max(
      config.minStageWidth,
      Math.min(config.maxWidth, Math.floor(viewportSize.width.value * config.viewportWidthRatio)),
    )
    const maxHeight = Math.max(
      config.minStageHeight,
      Math.floor(viewportSize.height.value * config.viewportHeightRatio),
    )
    const minWidth = Math.min(config.minWidth, maxWidth)

    let nextWidth = width || Math.min(config.defaultWidth, maxWidth)
    let nextHeight = height || Math.min(config.defaultHeight, maxHeight)

    if (nextWidth > maxWidth) {
      const scale = maxWidth / nextWidth
      nextWidth *= scale
      nextHeight *= scale
    }

    if (nextHeight > maxHeight) {
      const scale = maxHeight / nextHeight
      nextWidth *= scale
      nextHeight *= scale
    }

    if (nextWidth < minWidth) {
      const scale = minWidth / nextWidth
      const expandedWidth = nextWidth * scale
      const expandedHeight = nextHeight * scale
      if (expandedWidth <= maxWidth && expandedHeight <= maxHeight) {
        nextWidth = expandedWidth
        nextHeight = expandedHeight
      }
    }

    return {
      width: Math.round(nextWidth),
      height: Math.round(nextHeight),
    }
  }

  const displaySize = computed(() => {
    return fitImageSize(naturalWidth.value, naturalHeight.value)
  })

  const stageStyle = computed(() => ({
    width: `${displaySize.value.width}px`,
    height: `${displaySize.value.height}px`,
  }))

  const imageStyle = computed(() => ({
    width: `${displaySize.value.width}px`,
    height: `${displaySize.value.height}px`,
  }))

  const resetNaturalSize = () => {
    naturalWidth.value = 0
    naturalHeight.value = 0
  }

  const applyNaturalSize = (image: HTMLImageElement) => {
    const config = sizeConfig.value
    naturalWidth.value = image.naturalWidth || config.defaultWidth
    naturalHeight.value = image.naturalHeight || config.defaultHeight
  }

  return {
    stageStyle,
    imageStyle,
    resetNaturalSize,
    applyNaturalSize,
  }
}
