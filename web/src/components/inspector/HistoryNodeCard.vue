<template>
  <article
    class="history-node-card"
    :class="{
      'is-selected': selected,
      'is-pending': pending,
      'is-dragging': dragging,
    }"
  >
    <button
      type="button"
      class="history-node-select"
      :disabled="disabled"
      :aria-pressed="selected"
      :aria-label="`Open revision ${node.sequence}`"
      @click="emit('select')"
    >
      <span class="history-node-heading">
        <span class="history-node-sequence f-s fw-bold">Revision {{ node.sequence }}</span>
        <span v-if="latest" class="history-node-latest meta-tag">Latest</span>
      </span>
      <span class="history-node-details">
        <span class="history-node-meta f-xs fc-sec">{{ authorLabel }}</span>
        <time class="history-node-meta f-xs fc-sec" :datetime="node.created_at">
          {{ createdAtLabel }}
        </time>
      </span>
    </button>

    <BaseTooltip text="Delete revision" placement="bottom">
      <button
        type="button"
        class="icon-btn"
        :disabled="disabled"
        aria-label="Delete revision"
        @pointerdown.stop
        @click.stop="emit('delete')"
      >
        <component :is="TrashIcon" />
      </button>
    </BaseTooltip>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HistoryNode } from '@/types/history'
import BaseTooltip from '@/components/base/BaseTooltip.vue'
import TrashIcon from '@/assets/icons/trash.svg'

const props = defineProps<{
  node: HistoryNode
  selected: boolean
  latest: boolean
  pending: boolean
  dragging: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  (event: 'select'): void
  (event: 'delete'): void
}>()

const authorLabel = computed(() => props.node.author || 'Anonymous')
const createdAtLabel = computed(() => {
  const date = new Date(props.node.created_at)
  if (Number.isNaN(date.getTime())) {
    return props.node.created_at
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
})
</script>

<style scoped>
.history-node-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  width: var(--history-node-width);
  padding: var(--history-node-padding-y) var(--history-node-padding-x);
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 0 var(--line-width) var(--color-line);
  background-color: var(--color-bg-pri);
  color: var(--color-text-pri);
  box-sizing: border-box;
  overflow: visible;
  transition:
    background-color var(--motion-soft-duration) ease,
    box-shadow var(--motion-soft-duration) ease,
    opacity var(--motion-soft-duration) ease;
}

.history-node-card.is-selected {
  background-color: var(--color-action-light);
  box-shadow: inset 0 0 0 var(--control-line-width) var(--color-action);
}

.history-node-card.is-pending {
  opacity: var(--opacity-disabled);
}

.history-node-select {
  min-height: var(--history-node-min-height);
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.history-node-select:disabled,
.history-node-card :deep(.icon-btn:disabled) {
  cursor: default;
}

.history-node-heading {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--space-sm);
}

.history-node-card :deep(.tooltip-anchor) {
  flex: 0 0 auto;
  opacity: 0;
  transition: opacity var(--motion-soft-duration) ease;
}

.history-node-card:hover :deep(.tooltip-anchor),
.history-node-card :deep(.tooltip-anchor:focus-within) {
  opacity: 1;
}

.history-node-details {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  margin-top: var(--space-xs);
  gap: var(--space-xs);
}

.history-node-sequence,
.history-node-meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-node-latest {
  flex: 0 0 auto;
  background-color: var(--color-action);
}

@media (hover: none) {
  .history-node-card :deep(.tooltip-anchor) {
    opacity: 1;
  }
}
</style>
