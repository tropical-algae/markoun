<template>
  <component
    :is="tag"
    class="base-skeleton"
    :class="{ 'is-inline': inline }"
    :style="skeletonStyle"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  tag?: string;
  inline?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  radius: '999px',
  tag: 'div',
  inline: false,
});

const normalizeSize = (value: string | number): string => {
  return typeof value === 'number' ? `${value}px` : value;
};

const skeletonStyle = computed(() => ({
  '--skeleton-width': normalizeSize(props.width),
  '--skeleton-height': normalizeSize(props.height),
  '--skeleton-radius': normalizeSize(props.radius),
}));
</script>

<style scoped>
.base-skeleton {
  display: block;
  width: var(--skeleton-width);
  height: var(--skeleton-height);
  border-radius: var(--skeleton-radius);
  background-color: var(--color-skeleton);
  animation: skeleton-breathe 1.35s ease-in-out infinite;
}

.base-skeleton.is-inline {
  display: inline-block;
}

@keyframes skeleton-breathe {
  0%,
  100% {
    opacity: 0.56;
  }

  50% {
    opacity: 0.88;
  }
}
</style>
