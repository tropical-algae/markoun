<template>
  <div class="workspace-shell">
    <header class="workspace-header f-m fw-9 fc-pri">
      <slot name="header">
        <span class="workspace-brand-logo" aria-hidden="true"></span>
        <span>Markoun</span>
      </slot>
    </header>

    <main class="workspace-main">
      <aside class="workspace-rail">
        <slot name="rail"></slot>
      </aside>

      <section
        :ref="setStageRef"
        class="workspace-stage"
        :class="{
          'has-mobile-pane': isCompactLayout && (leftOpen || rightOpen),
          'is-resizing': activeResize !== null,
        }"
        :style="stageStyle"
      >
        <aside
          ref="leftPaneRef"
          class="workspace-pane workspace-left-pane"
          :class="{ 'is-open': leftOpen }"
          :inert="!leftOpen"
          :aria-hidden="!leftOpen"
        >
          <div class="workspace-pane-content workspace-left-pane-content">
            <slot name="left-pane"></slot>
          </div>
        </aside>

        <aside
          ref="rightPaneRef"
          class="workspace-pane workspace-right-pane"
          :class="{ 'is-open': rightOpen }"
          :inert="!rightOpen"
          :aria-hidden="!rightOpen"
        >
          <div class="workspace-pane-content workspace-right-pane-content">
            <slot name="right-pane"></slot>
          </div>
        </aside>

        <section class="workspace-editor-surface">
          <slot></slot>
        </section>

        <div
          class="workspace-pane-handle workspace-left-handle"
          :class="{ 'is-active': leftOpen }"
          role="separator"
          aria-label="Resize sidebar"
          aria-orientation="vertical"
          :aria-valuenow="Math.round(effectiveWidths.left)"
          :aria-valuemin="leftMinWidth"
          :aria-valuemax="leftMaxWidth"
          :tabindex="isCompactLayout || !leftOpen ? -1 : 0"
          @pointerdown="startResize('left', $event)"
          @pointermove="continueResize"
          @pointerup="stopResize"
          @pointercancel="stopResize"
          @keydown="resizeWithKeyboard('left', $event)"
        ></div>

        <div
          class="workspace-pane-handle workspace-right-handle"
          :class="{ 'is-active': rightOpen }"
          role="separator"
          aria-label="Resize inspector"
          aria-orientation="vertical"
          :aria-valuenow="Math.round(effectiveWidths.right)"
          :aria-valuemin="rightMinWidth"
          :aria-valuemax="rightMaxWidth"
          :tabindex="isCompactLayout || !rightOpen ? -1 : 0"
          @pointerdown="startResize('right', $event)"
          @pointermove="continueResize"
          @pointerup="stopResize"
          @pointercancel="stopResize"
          @keydown="resizeWithKeyboard('right', $event)"
        ></div>
      </section>
    </main>

    <footer class="workspace-footer f-s fc-sec">
      <slot name="footer">&copy; 2026 tropical algae. MIT License</slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import { useCompactLayout } from '@/composables/useCompactLayout'
import { useWorkspacePaneResize } from '@/layouts/useWorkspacePaneResize'

const props = defineProps<{
  leftOpen: boolean
  rightOpen: boolean
}>()

const leftPaneRef = ref<HTMLElement | null>(null)
const rightPaneRef = ref<HTMLElement | null>(null)
const isCompactLayout = useCompactLayout()
const {
  activeResize,
  continueResize,
  effectiveWidths,
  leftMaxWidth,
  leftMinWidth,
  resizeWithKeyboard,
  rightMaxWidth,
  rightMinWidth,
  stageRef,
  stageStyle,
  startResize,
  stopResize,
} = useWorkspacePaneResize({
  leftOpen: toRef(props, 'leftOpen'),
  rightOpen: toRef(props, 'rightOpen'),
  isCompact: isCompactLayout,
})

const setStageRef = (element: unknown) => {
  stageRef.value = element instanceof HTMLElement ? element : null
}

const clearPaneFocus = (pane: HTMLElement | null) => {
  const activeElement = document.activeElement
  if (activeElement instanceof HTMLElement && pane?.contains(activeElement)) {
    activeElement.blur()
  }
}

watch(() => props.leftOpen, (open) => {
  if (!open) {
    clearPaneFocus(leftPaneRef.value)
  }
}, { flush: 'sync' })

watch(() => props.rightOpen, (open) => {
  if (!open) {
    clearPaneFocus(rightPaneRef.value)
  }
}, { flush: 'sync' })
</script>

<style scoped>
.workspace-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.workspace-header {
  min-height: var(--icon-button-size);
  padding-top: var(--safe-area-top);
  padding-left: calc(var(--space-sm) + var(--safe-area-left));
  padding-right: calc(var(--space-sm) + var(--safe-area-right));
  flex-shrink: 0;
  border-bottom: var(--line-width) solid var(--color-line);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--space-compact);
  transition: border-color var(--motion-theme-duration) ease;
}

.workspace-brand-logo {
  height: var(--workspace-brand-logo-height);
  aspect-ratio: var(--brand-logo-aspect-ratio);
  flex-shrink: 0;
  background-color: currentColor;
  mask: url('@/assets/icons/markoun-logo.svg') center / contain no-repeat;
}

.workspace-main {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.workspace-rail {
  width: calc(var(--layout-sidebar-rail-width) * 1px);
  flex: 0 0 calc(var(--layout-sidebar-rail-width) * 1px);
  min-width: 0;
  height: 100%;
  padding-inline: var(--space-sm);
  border-right: var(--line-width) solid var(--color-line);
  background-color: var(--color-bg-sec);
  box-sizing: border-box;
  user-select: none;
  transition:
    background-color var(--motion-theme-duration) ease,
    border-color var(--motion-theme-duration) ease;
}

.workspace-stage {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  isolation: isolate;
}

.workspace-pane,
.workspace-editor-surface {
  position: absolute;
  inset-block: 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.workspace-pane {
  z-index: 1;
  contain: layout paint;
}

.workspace-left-pane {
  inset-inline-start: 0;
  width: var(--workspace-left-pane-width);
}

.workspace-right-pane {
  inset-inline-end: 0;
  width: var(--workspace-right-pane-width);
}

.workspace-pane-content {
  width: 100%;
  height: 100%;
  padding-inline: var(--space-lg);
  box-sizing: border-box;
}

.workspace-left-pane-content {
  min-width: var(--layout-sidebar-inner-min-width);
  white-space: nowrap;
}

.workspace-right-pane-content {
  white-space: nowrap;
}

.workspace-editor-surface {
  z-index: 2;
  inset-inline-start: var(--workspace-left-pane-reveal);
  inset-inline-end: var(--workspace-right-pane-reveal);
  display: flex;
  background-color: var(--color-bg-sec);
  contain: layout paint;
  transition:
    inset-inline-start var(--motion-pane-duration) var(--motion-pane-easing),
    inset-inline-end var(--motion-pane-duration) var(--motion-pane-easing),
    background-color var(--motion-theme-duration) ease;
}

.workspace-stage.is-resizing .workspace-editor-surface {
  transition:
    background-color var(--motion-theme-duration) ease;
}

.workspace-pane-handle {
  position: absolute;
  inset-block: 0;
  z-index: 3;
  width: var(--layout-pane-resize-hit-width);
  cursor: col-resize;
  touch-action: none;
  pointer-events: none;
  outline: none;
}

.workspace-pane-handle::before {
  position: absolute;
  inset-block: 0;
  inset-inline-start: calc(50% - var(--line-width) / 2);
  width: var(--line-width);
  background-color: var(--color-line);
  opacity: 0;
  content: "";
  transition:
    opacity var(--motion-pane-duration) ease,
    background-color var(--motion-theme-duration) ease,
    box-shadow var(--motion-soft-duration) ease;
}

.workspace-pane-handle:focus-visible::before,
.workspace-pane-handle:hover::before {
  background-color: var(--color-action);
  box-shadow: 0 0 0 var(--control-focus-ring-size) var(--color-action-light);
}

.workspace-left-handle {
  inset-inline-start: calc(
    var(--workspace-left-pane-reveal) - var(--layout-pane-resize-hit-width) / 2
  );
  transition: inset-inline-start var(--motion-pane-duration) var(--motion-pane-easing);
}

.workspace-right-handle {
  inset-inline-end: calc(
    var(--workspace-right-pane-reveal) - var(--layout-pane-resize-hit-width) / 2
  );
  transition: inset-inline-end var(--motion-pane-duration) var(--motion-pane-easing);
}

.workspace-pane-handle.is-active {
  pointer-events: auto;
}

.workspace-pane-handle.is-active::before {
  opacity: 1;
}

.workspace-stage.is-resizing .workspace-pane-handle {
  transition: none;
}

.workspace-footer {
  min-height: var(--icon-button-size);
  padding-bottom: var(--safe-area-bottom);
  padding-left: calc(var(--space-sm) + var(--safe-area-left));
  padding-right: calc(var(--space-sm) + var(--safe-area-right));
  flex-shrink: 0;
  border-top: var(--line-width) solid var(--color-line);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  user-select: none;
  transition: border-color var(--motion-theme-duration) ease;
}

@media (max-width: 768px) {
  .workspace-pane,
  .workspace-editor-surface {
    inset: 0;
    width: 100%;
    transition: none;
  }

  .workspace-pane {
    display: none;
    z-index: 2;
  }

  .workspace-pane.is-open {
    display: block;
  }

  .workspace-stage.has-mobile-pane .workspace-editor-surface {
    display: none;
  }

  .workspace-pane-content {
    width: 100%;
    min-width: 0;
  }

  .workspace-pane-handle {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .workspace-editor-surface,
  .workspace-pane-handle,
  .workspace-pane-handle::before {
    transition: none;
  }
}
</style>
