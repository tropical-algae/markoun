<template>
  <button class="ghost-btn" :class="[`type-${theme}`]">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">

interface Props {
  theme?: 'primary' | 'danger' | 'secondary' | 'submit';
}

withDefaults(defineProps<Props>(), {
  theme: 'primary'
});
</script>
