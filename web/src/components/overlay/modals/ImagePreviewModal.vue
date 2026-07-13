<template>
  <BaseModal v-model="isVisible" :title="previewTitle">
    <div class="image-preview-shell">
      <div class="image-preview-stage" :style="stageStyle">
        <img
          v-if="imageUrl"
          :key="imageUrl"
          :src="imageUrl"
          :alt="previewTitle"
          class="image-preview-image"
          :class="{ 'is-ready': previewLoadState === 'ready' }"
          :style="imageStyle"
          @load="handleImageLoad"
          @error="handleImageError"
          @dragstart.prevent
        />

        <AsyncGate
          :status="previewLoadState"
          tag="div"
          class="image-preview-overlay"
        >
          <template #loading>
            <BaseSkeleton
              class="image-preview-skeleton"
              :width="`${displaySize.width}px`"
              :height="`${displaySize.height}px`"
              radius="10px"
            />
          </template>

          <template #error>
            <span class="image-preview-error f-s">Unable to load this image.</span>
          </template>
        </AsyncGate>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import BaseModal from '@/components/base/BaseModal.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import AsyncGate from '@/components/base/AsyncGate.vue';

import { useNodeStore } from '@/stores/note';
import { useViewportSize } from '@/composables/useViewportSize';
import type { AsyncStatus } from '@/types/async';
import { readCssNumber } from '@/utils/css';

const nodeStore = useNodeStore()
const viewportSize = useViewportSize()

const naturalWidth = ref(0)
const naturalHeight = ref(0)
const previewLoadState = ref<AsyncStatus>('idle')

const isVisible = computed({
  get: () => Boolean(nodeStore.currentPreviewImageNode),
  set: (value: boolean) => {
    if (!value) {
      nodeStore.closeImagePreview()
    }
  },
})

const imageUrl = computed(() => nodeStore.currentPreviewImageUrl)
const previewTitle = computed(() => nodeStore.currentPreviewImageNode?.name || 'Image Preview')

const readPreviewSizeConfig = () => ({
  defaultWidth: readCssNumber('--image-preview-default-width', 640),
  defaultHeight: readCssNumber('--image-preview-default-height', 420),
  minWidth: readCssNumber('--image-preview-min-width', 280),
  maxWidth: readCssNumber('--image-preview-max-width', 720),
  minStageWidth: readCssNumber('--image-preview-min-stage-width', 220),
  minStageHeight: readCssNumber('--image-preview-min-stage-height', 180),
  viewportWidthRatio: readCssNumber('--image-preview-viewport-width-ratio', 0.82),
  viewportHeightRatio: readCssNumber('--image-preview-viewport-height-ratio', 0.72),
})

const resetPreviewState = () => {
  naturalWidth.value = 0
  naturalHeight.value = 0
  previewLoadState.value = imageUrl.value ? 'loading' : 'idle'
}

const fitImageSize = (width: number, height: number) => {
  const config = readPreviewSizeConfig()
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

const handleImageLoad = (event: Event) => {
  const image = event.target as HTMLImageElement
  const config = readPreviewSizeConfig()
  naturalWidth.value = image.naturalWidth || config.defaultWidth
  naturalHeight.value = image.naturalHeight || config.defaultHeight
  previewLoadState.value = 'ready'
}

const handleImageError = () => {
  previewLoadState.value = 'error'
}

watch(imageUrl, () => {
  resetPreviewState()
}, { immediate: true })
</script>

<style scoped>
.image-preview-shell {
  display: flex;
  justify-content: center;
  min-width: var(--image-preview-shell-min-width);
}

.image-preview-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--image-preview-radius);
  background-color: var(--color-bg-sec);
}

.image-preview-image {
  display: block;
  object-fit: contain;
  opacity: 0;
  transition: opacity var(--motion-soft-duration) ease;
}

.image-preview-image.is-ready {
  opacity: 1;
}

.image-preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-sec);
}

.image-preview-error {
  color: var(--color-text-sec);
  text-align: center;
  padding: var(--modal-body-padding);
}

.image-preview-skeleton {
  max-width: 100%;
  max-height: 100%;
}
</style>
