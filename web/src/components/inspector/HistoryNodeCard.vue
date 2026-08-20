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
        <span v-if="latest" class="history-node-latest f-xs">Latest</span>
      </span>
      <span class="history-node-meta f-xs fc-sec">{{ authorLabel }}</span>
      <time class="history-node-meta f-xs fc-sec" :datetime="node.created_at">
        {{ createdAtLabel }}
      </time>
    </button>

    <BaseTooltip
      class="history-node-delete-control"
      text="Delete revision"
      placement="left"
    >
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
  position: relative;
  width: var(--history-node-width);
  min-height: var(--history-node-height);
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
  width: 100%;
  min-height: var(--history-node-height);
  padding: var(--history-node-padding-y) var(--history-node-padding-x);
  border: 0;
  border-radius: inherit;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
}

.history-node-select:disabled,
.history-node-delete-control :deep(button:disabled) {
  cursor: default;
}

.history-node-heading {
  display: flex;
  align-items: center;
  min-width: 0;
  padding-right: var(--icon-button-size);
  gap: var(--space-sm);
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
  padding-inline: var(--meta-tag-padding-x);
  border-radius: var(--radius-pill);
  background-color: var(--color-action);
  color: var(--color-text-inverse);
  line-height: var(--meta-tag-height);
}

.history-node-meta {
  margin-top: var(--space-xs);
}

.history-node-delete-control {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  opacity: 0;
  transition: opacity var(--motion-soft-duration) ease;
}

.history-node-card:hover .history-node-delete-control,
.history-node-delete-control:focus-within {
  opacity: 1;
}

@media (hover: none) {
  .history-node-delete-control {
    opacity: 1;
  }
}
</style>
