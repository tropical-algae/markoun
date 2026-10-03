<template>
  <nav v-if="pageCount > 1" class="base-pagination f-s" aria-label="Pagination">
    <button
      type="button"
      class="pagination-button"
      :disabled="disabled || page <= 1"
      aria-label="Previous page"
      @click="emit('update:page', page - 1)"
    >
      Previous
    </button>
    <span class="pagination-position fc-sec" :aria-label="`Page ${page} of ${pageCount}`">
      {{ page }} / {{ pageCount }}
    </span>
    <button
      type="button"
      class="pagination-button"
      :disabled="disabled || page >= pageCount"
      aria-label="Next page"
      @click="emit('update:page', page + 1)"
    >
      Next
    </button>
  </nav>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  page: number
  pageCount: number
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  (event: 'update:page', page: number): void
}>()
</script>

<style scoped>
.base-pagination {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  min-width: 0;
}

.pagination-position {
  text-align: center;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.pagination-button {
  justify-self: start;
  min-height: var(--icon-button-size);
  padding-inline: var(--space-xs);
  border-radius: var(--radius-sm);
  color: var(--color-text-pri);
  cursor: pointer;
  transition: background-color var(--motion-soft-duration) ease;
}

.pagination-button:last-child {
  justify-self: end;
}

.pagination-button:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}

.pagination-button:focus-visible {
  outline: var(--line-width) solid var(--color-action);
  outline-offset: calc(var(--line-width) * -1);
}

@media (hover: hover) {
  .pagination-button:not(:disabled):hover {
    background-color: var(--color-bg-selected);
  }
}
</style>
