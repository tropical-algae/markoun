<template>
  <section
    class="editor-wrapper"
    :class="{
      'is-resizing': isInspectorResizing,
      'is-wide-lines': wideLines,
    }"
  >
    <slot name="header"></slot>

    <div class="editor-container">
      <slot></slot>
    </div>
  </section>

  <aside
    ref="inspectorWrapperRef"
    class="inspector-wrapper"
    :style="inspectorWrapperStyle"
    :class="{ 'is-width-animated': !isInspectorResizing, 'is-open': inspectorOpen }"
    :inert="!inspectorOpen"
    :aria-hidden="!inspectorOpen"
  >
    <div class="inspector-container f-m" :style="inspectorContainerStyle">
      <slot name="inspector" :close-inspector="closeInspector"></slot>
    </div>
    <div
      class="vertical-line turn-left col-drag"
      @pointerdown.prevent="startResizing"
      :class="{ 'is-resizing': isInspectorResizing }"
    ></div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useResponsivePane } from '@/layouts/useResponsivePane'

const props = defineProps<{
  inspectorOpen: boolean
  wideLines?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:inspectorOpen', value: boolean): void
}>()

const inspectorWrapperRef = ref<HTMLElement | null>(null)

const {
  isResizing: isInspectorResizing,
  startResizing,
  wrapperStyle: inspectorWrapperStyle,
  contentStyle: inspectorContainerStyle,
} = useResponsivePane({
  visible: computed(() => props.inspectorOpen),
  initialWidth: { name: '--layout-inspector-width-default', fallback: 250 },
  minWidth: { name: '--layout-inspector-width-min', fallback: 200 },
  maxWidth: { name: '--layout-inspector-width-max', fallback: 600 },
  direction: 'left',
})

const clearInspectorFocus = () => {
  const activeElement = document.activeElement
  if (
    activeElement instanceof HTMLElement
    && inspectorWrapperRef.value?.contains(activeElement)
  ) {
    activeElement.blur()
  }
}

const closeInspector = () => {
  clearInspectorFocus()
  emit('update:inspectorOpen', false)
}
</script>

<style scoped>
.editor-wrapper {
  --editor-content-padding-x: calc(
    max(var(--editor-content-padding-x-min), (100% - var(--editor-content-max-width)) / 2)
  );

  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  padding-inline: var(--editor-shell-padding-x);
  background-color: var(--color-bg-sec);
  overflow: hidden;
  transition: background-color var(--motion-theme-duration) ease;
}

.editor-wrapper.is-wide-lines {
  --editor-content-padding-x: var(--editor-content-padding-x-min);
}

.editor-container {
  flex: 1;
  display: flex;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.inspector-wrapper {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--color-bg-sec);
  transition: background-color var(--motion-theme-duration) ease;
}

.inspector-wrapper.is-width-animated {
  transition:
    width var(--motion-medium-duration) ease,
    background-color var(--motion-theme-duration) ease;
}

.inspector-container {
  height: 100%;
  min-width: 0;
  padding-inline: var(--editor-inspector-padding-x);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  white-space: nowrap;
}

:deep(.inspector-close-control) {
  display: none;
}

@media (max-width: 768px) {
  .editor-wrapper {
    width: 100%;
    min-height: 0;
    --editor-content-padding-y: var(--layout-mobile-editor-padding-y);
    --editor-content-padding-x-min: var(--layout-mobile-editor-padding-x-min);
  }

  .inspector-wrapper {
    position: absolute;
    inset: 0 0 0 auto;
    z-index: calc(var(--layout-mobile-layer-z-index) + 1);
    width: 0;
    max-width: 100%;
    box-shadow: none;
  }

  .inspector-wrapper.is-width-animated {
    transition: background-color var(--motion-theme-duration) ease;
  }

  .inspector-wrapper.is-open {
    width: 100%;
    box-shadow: none;
  }

  .inspector-container {
    width: 100%;
  }

  .inspector-wrapper .vertical-line {
    display: none;
  }

  :deep(.inspector-close-control) {
    display: inline-flex;
    margin-left: auto;
  }

  :deep(.inspector-close-button:active) {
    background-color: var(--color-bg-selected);
  }
}
</style>
