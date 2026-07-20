<template>
  <div class="workspace-shell">
    <header class="workspace-header f-m fw-9 fc-pri">
      <slot name="header">
        <span class="workspace-brand-logo" aria-hidden="true"></span>
        <span>Markoun</span>
      </slot>
    </header>

    <main
      class="workspace-main"
      :class="{ 'is-mobile-sidebar-open': isCompactLayout && isSidebarPanelOpen }"
    >
      <slot name="sidebar"></slot>

      <section class="workspace-editor-pane">
        <slot></slot>
      </section>
    </main>

    <footer class="workspace-footer f-s fc-sec">
      <slot name="footer">&copy; 2026 tropical algae. MIT License</slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { provide, ref, watch } from 'vue'
import { useCompactLayout } from '@/composables/useCompactLayout'
import { workspaceLayoutKey } from '@/layouts/workspace-context'

const isCompactLayout = useCompactLayout()
const isSidebarPanelOpen = ref(false)

const updateSidebarPanelOpen = (value: boolean) => {
  isSidebarPanelOpen.value = value
}

const closeSidebarPanelOnCompact = () => {
  if (isCompactLayout.value) {
    isSidebarPanelOpen.value = false
  }
}

provide(workspaceLayoutKey, {
  isCompactLayout,
  isSidebarPanelOpen,
  setSidebarPanelOpen: updateSidebarPanelOpen,
  closeSidebarPanelOnCompact,
})

watch(isCompactLayout, (isCompact) => {
  isSidebarPanelOpen.value = !isCompact
}, { immediate: true })
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
  padding-left: calc(var(--workspace-chrome-padding-x) + var(--safe-area-left));
  padding-right: calc(var(--workspace-chrome-padding-x) + var(--safe-area-right));
  flex-shrink: 0;
  border-bottom: var(--divider-line-width) solid var(--color-line);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--workspace-brand-logo-gap);
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
  flex-direction: row;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

.workspace-editor-pane {
  position: relative;
  flex: 1;
  display: flex;
  min-width: 0;
  overflow: hidden;
}

.workspace-footer {
  min-height: var(--icon-button-size);
  padding-bottom: var(--safe-area-bottom);
  padding-left: calc(var(--workspace-chrome-padding-x) + var(--safe-area-left));
  padding-right: calc(var(--workspace-chrome-padding-x) + var(--safe-area-right));
  flex-shrink: 0;
  border-top: var(--divider-line-width) solid var(--color-line);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  user-select: none;
  transition: border-color var(--motion-theme-duration) ease;
}

@media (max-width: 768px) {
  .workspace-main.is-mobile-sidebar-open .workspace-editor-pane {
    display: none;
  }
}
</style>
