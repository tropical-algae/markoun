<template>
  <div class="file-tree-state-host">
    <AsyncGate
      :status="status"
      class="file-tree-state"
      transition-name="file-tree-state-swap"
      transition-mode="simultaneous"
    >
      <template #loading>
        <slot name="loading" />
      </template>

      <template #error>
        <slot name="error" />
      </template>

      <slot />
    </AsyncGate>
  </div>
</template>

<script setup lang="ts">
import AsyncGate from '@/components/base/AsyncGate.vue'
import type { AsyncStatus } from '@/types/async'

defineProps<{
  status: AsyncStatus
}>()
</script>

<style scoped>
.file-tree-state-host,
.file-tree-state {
  width: 100%;
  min-width: 0;
}

.file-tree-state-host {
  position: relative;
  isolation: isolate;
}

.file-tree-state {
  position: relative;
  z-index: 1;
}

:deep(.file-tree-state-swap-leave-active) {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  transition: opacity var(--motion-soft-duration) ease;
}

:deep(.file-tree-state-swap-leave-active .base-skeleton) {
  animation-play-state: paused;
}

:deep(.file-tree-state-swap-leave-to) {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.file-tree-state-swap-leave-active) {
    transition: none;
  }
}
</style>
