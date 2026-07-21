<template>
  <section
    class="inspector-panel"
    :class="{ 'is-meta': props.meta }"
  >
    <BaseHeader>
      <div class="inspector-header-content">
        <div class="text-uppercase f-s fc-pri">{{ props.title }}</div>
        <BaseTooltip class="inspector-close-control" text="Close" placement="bottom">
          <button
            class="inspector-close-button icon-btn"
            type="button"
            aria-label="Close inspector"
            @click="emit('close')"
          >
            <component :is="CloseIcon" />
          </button>
        </BaseTooltip>
      </div>
    </BaseHeader>

    <AsyncGate
      :status="props.status"
      :show-delay-ms="props.showDelayMs"
      tag="div"
      class="inspector-panel-body touch-scroll"
      :class="props.bodyClass"
    >
      <template #loading>
        <slot name="loading"></slot>
      </template>

      <slot></slot>
    </AsyncGate>
  </section>
</template>

<script setup lang="ts">
import type { AsyncStatus } from '@/types/async'
import BaseHeader from '@/components/base/BaseHeader.vue'
import AsyncGate from '@/components/base/AsyncGate.vue'
import BaseTooltip from '@/components/base/BaseTooltip.vue'

import CloseIcon from '@/assets/icons/circle-xmark.svg'

const props = defineProps<{
  title: string
  status: AsyncStatus
  showDelayMs: number
  meta?: boolean
  bodyClass?: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()
</script>

<style scoped>
.inspector-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  padding: 0;
  box-sizing: border-box;
}

.inspector-panel.is-meta {
  font-size: var(--editor-inspector-meta-font-size);
}

.inspector-header-content {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.inspector-panel-body {
  flex: 1;
  margin-top: var(--space-md);
  content-visibility: auto;
  contain: layout paint style;
  overflow-y: scroll;
  overflow-x: hidden;
  white-space: normal;
}
</style>
