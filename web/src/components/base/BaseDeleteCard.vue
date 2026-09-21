<template>
  <article
    class="base-delete-card"
    :class="{ 'reveal-delete-on-hover': revealDeleteOnHover }"
  >
    <div class="base-delete-card-content">
      <slot></slot>
    </div>

    <BaseTooltip :text="deleteLabel" :placement="tooltipPlacement">
      <button
        type="button"
        class="icon-btn"
        :disabled="disabled"
        :aria-label="deleteLabel"
        @pointerdown.stop
        @click.stop="emit('delete')"
      >
        <component :is="TrashIcon" />
      </button>
    </BaseTooltip>
  </article>
</template>

<script setup lang="ts">
import type { TooltipPlacement } from '@/composables/useTooltipPosition'
import BaseTooltip from '@/components/base/BaseTooltip.vue'
import TrashIcon from '@/assets/icons/trash.svg'

withDefaults(defineProps<{
  deleteLabel: string
  disabled?: boolean
  revealDeleteOnHover?: boolean
  tooltipPlacement?: TooltipPlacement
}>(), {
  disabled: false,
  revealDeleteOnHover: false,
  tooltipPlacement: 'bottom',
})

const emit = defineEmits<{
  (event: 'delete'): void
}>()
</script>

<style scoped>
.base-delete-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--base-delete-card-padding, var(--space-sm));
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

.base-delete-card-content {
  flex: 1 1 auto;
  min-width: 0;
}

.base-delete-card :deep(.tooltip-anchor) {
  flex: 0 0 auto;
}

.base-delete-card.reveal-delete-on-hover :deep(.tooltip-anchor) {
  opacity: 0;
  transition: opacity var(--motion-soft-duration) ease;
}

.base-delete-card.reveal-delete-on-hover:hover :deep(.tooltip-anchor),
.base-delete-card.reveal-delete-on-hover :deep(.tooltip-anchor:focus-within) {
  opacity: 1;
}

@media (hover: none) {
  .base-delete-card.reveal-delete-on-hover :deep(.tooltip-anchor) {
    opacity: 1;
  }
}
</style>
