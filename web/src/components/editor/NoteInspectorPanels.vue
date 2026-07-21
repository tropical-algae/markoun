<template>
  <EditorInspectorPanel
    v-if="mode === InspectMode.Meta"
    title="File Meta"
    :status="status"
    :show-delay-ms="showDelayMs"
    body-class="note-meta"
    meta
    @close="emit('close')"
  >
    <template #loading>
      <div class="inspector-skeleton">
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
  </EditorInspectorPanel>

  <EditorInspectorPanel
    v-else-if="mode === InspectMode.Preview"
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
          height="var(--editor-preview-skeleton-media-height)"
          radius="var(--radius-lg)"
        />
      </div>
    </template>

    <div v-html="renderedHtml" class="fc-pri"></div>
  </EditorInspectorPanel>
</template>

<script setup lang="ts">
import type { AsyncStatus } from '@/types/async'
import { InspectMode } from '@/types/ui'
import EditorInspectorPanel from '@/components/editor/EditorInspectorPanel.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'

defineProps<{
  mode: InspectMode
  status: AsyncStatus
  showDelayMs: number
  contentLength: number
  meta: Record<string, string>
  renderedHtml: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()
</script>

<style scoped>
.inspector-skeleton,
.preview-skeleton {
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
  min-width: var(--editor-meta-value-min-width);
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: left;
}
</style>
