<template>
  <button class="ghost-btn" :class="[`type-${type}`]">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">

interface Props {
  type?: 'primary' | 'danger' | 'secondary';
}

withDefaults(defineProps<Props>(), {
  type: 'primary'
});
</script>
