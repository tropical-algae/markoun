<template>
  <div class="text-hint" :style="hintStyle">
    <div class="hint-icon" v-if="icon">
      <slot name="icon">
        <component :is="icon" />
      </slot>
    </div>

    <div class="hint-content">
      <slot>{{ text }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component, type CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
  text?: string
  icon?: Component
  fontSize?: string
  color?: string
}>(), {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-muted)'
})

const hintStyle = computed<CSSProperties>(() => ({
  color: props.color,
  fontSize: props.fontSize,
}))
</script>

<style scoped>
.text-hint {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-compact);

  font-size: var(--font-size-sm);
  line-height: var(--font-size-sm);
  width: 100%;
}

.hint-icon {
  flex-shrink: 0;
  width: var(--font-size-sm);
  height: var(--font-size-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hint-icon :deep(svg) {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.hint-content {
  height: 100%;
  flex: 1;
  min-width: 0;
  word-break: normal;
  overflow-wrap: anywhere;

  text-align: left;
}
</style>
