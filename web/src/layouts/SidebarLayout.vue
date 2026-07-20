<template>
  <aside
    class="sidebar-wrapper"
    :class="{ 'is-mobile-panel-open': isCompactLayout && panelVisible }"
  >
    <div class="sidebar-container">
      <slot name="rail-header"></slot>
      <slot name="rail"></slot>
    </div>

    <div
      class="sub-sidebar-container"
      :class="{ 'is-width-animated': !isPanelResizing, 'is-open': panelVisible }"
      :style="subSidebarContainerStyle"
      :inert="!panelVisible"
      :aria-hidden="!panelVisible"
    >
      <div class="sub-sidebar-inner" :style="subSidebarInnerStyle">
        <slot name="panel"></slot>
      </div>
    </div>

    <div
      class="vertical-line turn-right col-drag"
      @pointerdown.prevent="startResizing"
      :class="{ 'is-resizing': !panelVisible }"
    ></div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useResponsivePane } from '@/layouts/useResponsivePane'
import { useWorkspaceLayout } from '@/layouts/workspace-context'

const {
  isCompactLayout,
  isSidebarPanelOpen,
  setSidebarPanelOpen,
} = useWorkspaceLayout()

const panelVisible = computed({
  get: () => isSidebarPanelOpen.value,
  set: setSidebarPanelOpen,
})

const {
  isResizing: isPanelResizing,
  startResizing,
  wrapperStyle: subSidebarContainerStyle,
  contentStyle: subSidebarInnerStyle,
} = useResponsivePane({
  visible: panelVisible,
  initialWidth: { name: '--layout-sidebar-width-default', fallback: 250 },
  minWidth: { name: '--layout-sidebar-width-min', fallback: 240 },
  maxWidth: { name: '--layout-sidebar-width-max', fallback: 500 },
  direction: 'right',
})
</script>

<style scoped>
.sidebar-wrapper {
  display: flex;
  flex-direction: row;
  height: 100%;
  position: relative;
  user-select: none;
  flex-shrink: 0;
}

.sidebar-container {
  z-index: 2;
  padding-inline: var(--layout-sidebar-rail-padding-x);
  background-color: var(--color-bg-sec);
  border-right: var(--divider-line-width) solid var(--color-line);
  transition:
    background-color var(--motion-theme-duration) ease,
    border-color var(--motion-theme-duration) ease;
}

.sub-sidebar-container {
  overflow: hidden;
  min-width: 0;
  height: 100%;
  position: relative;
  transition: border-color var(--motion-theme-duration) ease;
}

.sub-sidebar-container.is-width-animated {
  transition:
    width var(--motion-medium-duration) ease,
    border-color var(--motion-theme-duration) ease;
}

.sub-sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 100%;
  min-width: var(--layout-sidebar-inner-min-width);
  padding-inline: var(--layout-sub-sidebar-padding-x);
  overflow-x: hidden;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .sidebar-wrapper {
    width: auto;
    height: 100%;
    flex-direction: row;
    z-index: var(--layout-mobile-layer-z-index);
  }

  .sidebar-wrapper.is-mobile-panel-open {
    width: 100%;
  }

  .sidebar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    height: 100%;
    border-right: var(--divider-line-width) solid var(--color-line);
    border-bottom: 0;
  }

  .sidebar-container :deep(.base-header) {
    width: 100%;
  }

  .sidebar-container :deep(.container-header) {
    justify-content: center;
  }

  .sub-sidebar-container {
    width: 0;
    height: 100%;
    max-height: none;
    border-bottom: 0;
  }

  .sub-sidebar-container.is-open {
    flex: 1;
    width: auto;
  }

  .sub-sidebar-inner {
    width: 100%;
    min-width: 0;
    height: 100%;
  }

  .vertical-line {
    display: none;
  }
}
</style>
