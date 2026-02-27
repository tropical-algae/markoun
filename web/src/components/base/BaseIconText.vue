<template>
  <div 
    class="text-hint" 
    :style="{ 
      color: color, 
      fontSize: fontSize 
    }"
  >
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
import type { Component } from 'vue';

withDefaults(defineProps<{
  text?: string;
  icon?: Component;
  fontSize?: string;
  color?: string;
}>(), {
  fontSize: '0.7rem',
  color: 'var(--color-text-trifle)'
});
</script>

<style scoped>
.text-hint {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  
  font-size: 0.7rem;
  line-height: 0.7rem;
  width: 100%;
}

.hint-icon {
  flex-shrink: 0;
  width: 0.7rem; 
  height: 0.7rem;
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
  word-wrap: break-word;
  word-break: break-all;

  text-align: left;
}
</style>