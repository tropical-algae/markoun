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
          :class="{ 'is-ready': !isLoading && !hasError }"
          :style="imageStyle"
          @load="handleImageLoad"
          @error="handleImageError"
          @dragstart.prevent
        />

        <Transition name="soft-swap" mode="out-in">
          <div v-if="isLoading" key="loading" class="image-preview-overlay">
            <BaseSkeleton
              class="image-preview-skeleton"
              :width="`${displaySize.width}px`"
              :height="`${displaySize.height}px`"
              radius="10px"
            />
          </div>

          <div v-else-if="hasError" key="error" class="image-preview-overlay image-preview-error">
            <span class="f-s">Unable to load this image.</span>
          </div>
        </Transition>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import BaseModal from '@/components/base/BaseModal.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';

import { useNodeStore } from '@/stores/note';

const DEFAULT_WIDTH = 640
const DEFAULT_HEIGHT = 420
const MIN_WIDTH = 280
const MAX_WIDTH = 720
const VIEWPORT_WIDTH_RATIO = 0.82
const VIEWPORT_HEIGHT_RATIO = 0.72

const nodeStore = useNodeStore()

const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)
const viewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 900)
const naturalWidth = ref(0)
const naturalHeight = ref(0)
const isLoading = ref(false)
const hasError = ref(false)

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

const updateViewport = () => {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
}

const resetPreviewState = () => {
  naturalWidth.value = 0
  naturalHeight.value = 0
  hasError.value = false
  isLoading.value = Boolean(imageUrl.value)
}

const fitImageSize = (width: number, height: number) => {
  const maxWidth = Math.max(220, Math.min(MAX_WIDTH, Math.floor(viewportWidth.value * VIEWPORT_WIDTH_RATIO)))
  const maxHeight = Math.max(180, Math.floor(viewportHeight.value * VIEWPORT_HEIGHT_RATIO))
  const minWidth = Math.min(MIN_WIDTH, maxWidth)

  let nextWidth = width || Math.min(DEFAULT_WIDTH, maxWidth)
  let nextHeight = height || Math.min(DEFAULT_HEIGHT, maxHeight)

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
  naturalWidth.value = image.naturalWidth || DEFAULT_WIDTH
  naturalHeight.value = image.naturalHeight || DEFAULT_HEIGHT
  hasError.value = false
  isLoading.value = false
}

const handleImageError = () => {
  hasError.value = true
  isLoading.value = false
}

watch(imageUrl, () => {
  resetPreviewState()
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', updateViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
})
</script>

<style scoped>
.image-preview-shell {
  display: flex;
  justify-content: center;
  min-width: min(82vw, 320px);
}

.image-preview-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 10px;
  background-color: var(--color-bg-sec);
}

.image-preview-image {
  display: block;
  object-fit: contain;
  opacity: 0;
  transition: opacity var(--motion-soft-duration) var(--motion-soft-ease);
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
  padding: 24px;
}

.image-preview-skeleton {
  max-width: 100%;
  max-height: 100%;
}
</style>
