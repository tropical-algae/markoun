<template>
  <BaseDeletableCard
    class="history-node-card"
    :class="{
      'is-selected': selected,
      'is-pending': pending,
      'is-dragging': dragging,
    }"
    delete-label="Delete revision"
    reveal-delete-on-hover
    :disabled="disabled"
    @delete="emit('delete')"
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
  </BaseDeletableCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HistoryNode } from '@/types/history'
import BaseDeletableCard from '@/components/base/BaseDeletableCard.vue'

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
  --base-deletable-card-padding: var(--history-node-padding-y) var(--history-node-padding-x);

  width: var(--history-node-width);
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

</style>
