<template>
  <aside
    class="sidebar-wrapper d-flex flex-row"
    :class="{ 'is-mobile-panel-open': isCompactLayout && showSubSidebar }"
  >
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
import { ref, watch } from "vue"
import { SidebarMode } from "@/types/ui"
import { useResizablePane } from "@/composables/useResizablePane"
import { useMediaQuery } from "@/composables/useMediaQuery"
import { COMPACT_LAYOUT_MEDIA_QUERY } from "@/constants/layout"
import { readCssNumber } from "@/utils/css"

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

const emit = defineEmits<{
  (event: 'mobile-panel-change', value: boolean): void
}>()

const isCompactLayout = useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY)
const showSubSidebar = ref(!isCompactLayout.value);
const sidebarTooltipPlacement = 'right'
const {
  width: subSidebarWidth,
  isResizing: isSubSidebarResizing,
  startResizing,
  visibleWidth,
} = useResizablePane({
  initialWidth: readCssNumber('--layout-sidebar-width-default', 250),
  minWidth: readCssNumber('--layout-sidebar-width-min', 240),
  maxWidth: readCssNumber('--layout-sidebar-width-max', 500),
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

watch(
  [showSubSidebar, isCompactLayout],
  () => {
    emit('mobile-panel-change', isCompactLayout.value && showSubSidebar.value)
  },
  { immediate: true },
)

watch(isCompactLayout, (isCompact) => {
  showSubSidebar.value = !isCompact
})

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
    width: auto;
    height: 100%;
    flex-direction: row !important;
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
    border-right: 1px solid var(--color-line);
    border-bottom: 0;
  }

  .sidebar-container :deep(header) {
    width: var(--icon-button-size);
  }

  .sidebar-nav {
    flex: 0 0 auto;
    flex-direction: column !important;
    justify-content: flex-start;
    margin-top: 1rem !important;
    margin-bottom: 1rem !important;
  }

  .sub-sidebar-container {
    width: 0 !important;
    height: 100%;
    max-height: none;
    border-bottom: 0;
    background-color: var(--color-bg-sec);
    transition:
      width var(--motion-medium-duration) ease,
      border-color var(--motion-theme-duration) ease,
      background-color var(--motion-theme-duration) ease;
  }

  .sub-sidebar-container.is-open {
    flex: 1;
    width: auto !important;
  }

  .sub-sidebar-inner {
    width: 100% !important;
    min-width: 0;
    height: 100%;
  }

  .vertical-line {
    display: none;
  }
}
</style>
