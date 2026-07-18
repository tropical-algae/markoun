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
              radius="var(--image-preview-radius)"
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
import { computed, ref, watch } from 'vue'

import BaseModal from '@/components/base/BaseModal.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import AsyncGate from '@/components/base/AsyncGate.vue'

import { useNodeStore } from '@/stores/note'
import { useImagePreviewSize } from '@/composables/useImagePreviewSize'
import type { AsyncStatus } from '@/types/async'

const nodeStore = useNodeStore()
const previewLoadState = ref<AsyncStatus>('idle')
const {
  displaySize,
  stageStyle,
  imageStyle,
  resetNaturalSize,
  applyNaturalSize,
} = useImagePreviewSize()

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

const resetPreviewState = () => {
  resetNaturalSize()
  previewLoadState.value = imageUrl.value ? 'loading' : 'idle'
}

const handleImageLoad = (event: Event) => {
  const image = event.target as HTMLImageElement
  applyNaturalSize(image)
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
