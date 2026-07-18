<template>
  <section
    class="modal-content-layout"
    :class="`is-${props.size}`"
  >
    <div class="modal-content-body">
      <slot></slot>
    </div>

    <div v-if="$slots.actions" class="modal-actions">
      <slot name="actions"></slot>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md'
}>(), {
  size: 'sm',
})
</script>

<style scoped>
.modal-content-layout {
  width: var(--modal-content-width);
  max-width: 100%;
  box-sizing: border-box;
}

.modal-content-layout.is-sm {
  --modal-content-width: var(--modal-width-sm);
}

.modal-content-layout.is-md {
  --modal-content-width: var(--modal-width-md);
}

.modal-content-body {
  width: 100%;
  min-width: 0;
}
</style>
