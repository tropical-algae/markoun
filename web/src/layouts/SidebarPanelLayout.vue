<template>
  <section class="sidebar-panel-layout">
    <BaseHeader v-if="props.title || $slots.header">
      <slot name="header">
        <div class="f-m fw-bold text-uppercase">{{ props.title }}</div>
      </slot>
    </BaseHeader>

    <div class="sidebar-panel-content">
      <slot></slot>
    </div>

    <slot name="footer"></slot>
  </section>
</template>

<script setup lang="ts">
import BaseHeader from '@/components/base/BaseHeader.vue'

const props = defineProps<{
  title?: string
}>()
</script>

<style scoped>
.sidebar-panel-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.sidebar-panel-layout :deep(.sidebar-panel-body) {
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: scroll;
  overscroll-behavior-x: none;
  box-sizing: border-box;
}

.sidebar-panel-content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  margin-block: var(--space-lg);
  box-sizing: border-box;
}

.sidebar-panel-layout :deep(.sidebar-panel-footer) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex-shrink: 0;
  padding-block: var(--space-lg);
  overflow-x: hidden;
  box-sizing: border-box;
}
</style>
