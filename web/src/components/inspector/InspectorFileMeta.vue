<template>
  <InspectorPanel
    class="file-meta-panel"
    title="File Meta"
    :status="status"
    :show-delay-ms="showDelayMs"
    @close="emit('close')"
  >
    <template #loading>
      <div class="meta-skeleton">
        <BaseSkeleton
          width="var(--skeleton-width-sm)"
          height="var(--skeleton-text-height-sm)"
        />
        <BaseSkeleton
          width="var(--skeleton-width-lg)"
          height="var(--skeleton-text-height-sm)"
        />
        <BaseSkeleton
          width="var(--skeleton-width-md)"
          height="var(--skeleton-text-height-sm)"
        />
      </div>
    </template>

    <div class="meta-grid">
      <div class="meta-key fc-sec">characters:</div>
      <div class="meta-value fc-sec">{{ contentLength }}</div>
      <template
        v-for="(value, key) in meta"
        :key="key"
      >
        <div class="meta-key fc-sec">{{ key }}:</div>
        <div class="meta-value fc-sec">{{ value }}</div>
      </template>
    </div>
  </InspectorPanel>
</template>

<script setup lang="ts">
import type { AsyncStatus } from '@/types/async'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import InspectorPanel from '@/components/inspector/InspectorPanel.vue'

defineProps<{
  status: AsyncStatus
  showDelayMs: number
  contentLength: number
  meta: Record<string, string>
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()
</script>

<style scoped>
.file-meta-panel {
  font-size: var(--inspector-meta-font-size);
}

.meta-skeleton {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  gap: var(--space-md);
  box-sizing: border-box;
}

.meta-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  row-gap: var(--space-sm);
  column-gap: var(--space-lg);
  align-items: start;
}

.meta-key {
  white-space: nowrap;
  text-align: left;
  font-weight: 600;
}

.meta-value {
  min-width: var(--inspector-meta-value-min-width);
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: left;
}
</style>
