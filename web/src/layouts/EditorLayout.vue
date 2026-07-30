<template>
  <section
    class="editor-wrapper"
    :class="{ 'is-wide-lines': wideLines }"
  >
    <slot name="header"></slot>

    <div class="editor-container">
      <slot></slot>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  wideLines?: boolean
}>()
</script>

<style scoped>
.editor-wrapper {
  --editor-content-padding-x: calc(
    max(var(--editor-content-padding-x-min), (100% - var(--editor-content-max-width)) / 2)
  );

  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding-inline: var(--space-lg);
  overflow: hidden;
}

.editor-wrapper.is-wide-lines {
  --editor-content-padding-x: var(--editor-content-padding-x-min);
}

.editor-container {
  display: flex;
  flex: 1 1 auto;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

@media (max-width: 768px) {
  .editor-wrapper {
    --editor-content-padding-y: var(--layout-mobile-editor-padding-y);
    --editor-content-padding-x-min: var(--layout-mobile-editor-padding-x-min);
  }
}
</style>
