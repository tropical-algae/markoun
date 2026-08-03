<template>
  <InspectorPanel
    title="Preview"
    :status="status"
    :show-delay-ms="showDelayMs"
    body-class="note-preview"
    @close="emit('close')"
  >
    <template #loading>
      <div class="preview-skeleton">
        <BaseSkeleton
          width="var(--skeleton-width-sm)"
          height="var(--skeleton-text-height-sm)"
        />
        <BaseSkeleton height="var(--skeleton-text-height-sm)" />
        <BaseSkeleton
          width="var(--skeleton-width-lg)"
          height="var(--skeleton-text-height-sm)"
        />
        <BaseSkeleton
          height="var(--inspector-preview-skeleton-media-height)"
          radius="var(--radius-lg)"
        />
      </div>
    </template>

    <div v-html="renderedHtml" class="fc-pri"></div>
  </InspectorPanel>
</template>

<script setup lang="ts">
import type { AsyncStatus } from '@/types/async'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import InspectorPanel from '@/components/inspector/InspectorPanel.vue'

defineProps<{
  status: AsyncStatus
  showDelayMs: number
  renderedHtml: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()
</script>

<style scoped>
.preview-skeleton {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  gap: var(--space-md);
  box-sizing: border-box;
}
</style>
