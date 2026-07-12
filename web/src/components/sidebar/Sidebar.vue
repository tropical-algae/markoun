<template>
  <aside class="sidebar-wrapper d-flex flex-row">
    <div class="sidebar-container px-2">
      <BaseHeader>
        <BaseTooltip text="Toggle sidebar" :placement="sidebarTooltipPlacement">
          <button
            @click="toggleSubSidebar()"
            aria-label="Toggle sidebar"
            :aria-expanded="showSubSidebar"
          >
            <component :is="SidebarToggleIcon" class="icon-btn"></component>
          </button>
        </BaseTooltip>
      </BaseHeader>

      <div class="sidebar-nav d-flex flex-column gap-2 my-3">
        <BaseTooltip
          v-for="item in sideBtns"
          :key="item.label"
          :text="item.label"
          :placement="sidebarTooltipPlacement"
        >
          <button
            class="sidebar-nav-button"
            :class="{ 'is-active': currentMode === item.mode && showSubSidebar }"
            @click="toggleSubSidebar(item.mode)"
            :aria-label="item.label"
            :aria-pressed="currentMode === item.mode && showSubSidebar"
          >
            <component :is="item.icon" class="icon-btn"></component>
          </button>
        </BaseTooltip>
      </div>
    </div>

    <div
      class="sub-sidebar-container"
      :class="{ 'is-smooth': !isSubSidebarResizing, 'is-open': showSubSidebar }"
      :style="{ width: currentWidth }"
      :inert="!showSubSidebar"
      :aria-hidden="!showSubSidebar"
    >
      <div
        class="sub-sidebar-inner d-flex flex-column px-3"
        :style="{ width: subSidebarWidth + 'px' }"
      >
        <SidebarFileTree
          v-if="currentMode === SidebarMode.FileTree"
          @node-opened="handleContentOpen"
        />
        <SidebarSearch
          v-else-if="currentMode === SidebarMode.Search"
          @node-opened="handleContentOpen"
        />
        <SidebarUser v-else-if="currentMode === SidebarMode.User" />
        <SidebarSetting v-else />
      </div>
    </div>

    <div
      class="vertical-line turn-right col-drag"
      @pointerdown.prevent="startResizing"
      :class="{ 'is-resizing': !showSubSidebar }"
    ></div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { SidebarMode } from "@/types/ui"
import { useResizablePane } from "@/composables/useResizablePane"
import { useMediaQuery } from "@/composables/useMediaQuery"
import { COMPACT_LAYOUT_MEDIA_QUERY, SIDEBAR_PANE_WIDTH } from "@/constants/ui"

import SidebarToggleIcon from "@/assets/icons/sidebar.svg"
import FileTreeIcon from "@/assets/icons/rectangle-list.svg"
import SearchIcon from "@/assets/icons/analytics-magnifying-glass.svg"
import SettingIcon from "@/assets/icons/settings.svg"
import UserIcon from "@/assets/icons/portrait.svg"

import SidebarFileTree from "@/components/sidebar/SidebarFileTree.vue"
import SidebarSearch from "@/components/sidebar/SidebarSearch.vue"
import SidebarSetting from "@/components/sidebar/SidebarSetting.vue"
import SidebarUser from "@/components/sidebar/SidebarUser.vue"
import BaseHeader from '@/components/base/BaseHeader.vue';
import BaseTooltip from '@/components/base/BaseTooltip.vue';

const showSubSidebar = ref(true);
const isCompactLayout = useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY)
const sidebarTooltipPlacement = computed(() => isCompactLayout.value ? 'bottom' : 'right')
const {
  width: subSidebarWidth,
  isResizing: isSubSidebarResizing,
  startResizing,
  visibleWidth,
} = useResizablePane({
  initialWidth: SIDEBAR_PANE_WIDTH.initial,
  minWidth: SIDEBAR_PANE_WIDTH.min,
  maxWidth: SIDEBAR_PANE_WIDTH.max,
  direction: 'right',
})

const currentMode = ref<SidebarMode>(SidebarMode.FileTree)
const currentWidth = visibleWidth(showSubSidebar);

const toggleSubSidebar = (mode: SidebarMode | null = null) => {
  if (mode === null) {
    showSubSidebar.value = !showSubSidebar.value;
    return;
  }

  const shouldExpand = currentMode.value !== mode || !showSubSidebar.value;
  showSubSidebar.value = shouldExpand;
  if (shouldExpand) {
    currentMode.value = mode;
  }
};

const handleContentOpen = () => {
  if (isCompactLayout.value) {
    showSubSidebar.value = false
  }
}

const sideBtns = [
  { icon: FileTreeIcon, label: 'Files', mode: SidebarMode.FileTree },
  { icon: SearchIcon, label: 'Search', mode: SidebarMode.Search },
  { icon: UserIcon, label: 'Profile', mode: SidebarMode.User },
  { icon: SettingIcon, label: 'Settings', mode: SidebarMode.Settings },
] as const

</script>

<style scoped>
.sidebar-wrapper {
  height: 100%;
  position: relative;
  user-select: none;
  flex-shrink: 0;
}

.sidebar-container {
  z-index: 2;
  background-color: var(--color-bg-sec);
  border-right: 1px solid var(--color-line);
  transition:
    background-color var(--motion-theme-duration) ease,
    border-color var(--motion-theme-duration) ease;
}

.file-tree-wrapper {
  overflow: hidden;
  position: relative;
}

.sub-sidebar-container {
  overflow: hidden;
  height: 100%;
  position: relative;
}

.sub-sidebar-inner {
  height: 100%;
  min-width: var(--layout-sidebar-inner-min-width);
  white-space: nowrap;
}

.sidebar-nav-button.is-active .icon-btn {
  fill: var(--color-action);
}

@media (max-width: 768px) {
  .sidebar-wrapper {
    width: 100%;
    height: auto;
    flex-direction: column !important;
    z-index: var(--layout-mobile-layer-z-index);
  }

  .sidebar-container {
    display: flex;
    align-items: center;
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid var(--color-line);
  }

  .sidebar-container :deep(.container-header) {
    height: var(--icon-button-size);
    border-bottom: 0;
  }

  .sidebar-nav {
    flex: 1;
    flex-direction: row !important;
    justify-content: flex-end;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }

  .sub-sidebar-container {
    width: 100% !important;
    height: auto;
    max-height: 0;
    border-bottom: 1px solid var(--color-line);
    background-color: var(--color-bg-sec);
    transition:
      max-height var(--motion-medium-duration) ease,
      border-color var(--motion-theme-duration) ease,
      background-color var(--motion-theme-duration) ease;
  }

  .sub-sidebar-container.is-open {
    max-height: var(--layout-mobile-sidebar-panel-max-height);
  }

  .sub-sidebar-inner {
    width: 100% !important;
    min-width: 0;
    height: var(--layout-mobile-sidebar-panel-max-height);
  }

  .vertical-line {
    display: none;
  }
}
</style>
