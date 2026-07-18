<template>
  <section class="sidebar-panel-layout">
    <BaseHeader v-if="props.title || $slots.header">
      <slot name="header">
        <div class="f-m fw-bold text-uppercase">{{ props.title }}</div>
      </slot>
    </BaseHeader>

    <slot></slot>

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
  min-height: 0;
  margin-block: var(--sidebar-panel-body-margin-y);
  overflow-y: scroll;
}

.sidebar-panel-layout :deep(.sidebar-panel-footer) {
  flex-shrink: 0;
  padding-block: var(--sidebar-panel-footer-padding-y);
}
</style>
