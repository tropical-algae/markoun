<template>
  <aside class="sidebar-wrapper d-flex flex-row">
    <div class="sidebar-container d-flex flex-column gap-2 px-2">
      <BaseHeader class="p-0">
        <button @click="toggleSubSidebar()">
          <component :is="SidebarToggleIcon" class="icon-btn"></component>
        </button>
      </BaseHeader>

      <button v-for="(item, _) in sideBtns" @click="item.func()">
        <component :is="item.icon" class="icon-btn"></component>
      </button>
      <div class="vertical-line turn-right"></div>
    </div>

    <div
      class="sub-sidebar-container"
      :class="{ 'is-smooth': !isSubSidebarResizing }"
      :style="{ width: currentWidth }"
    >
      <div
        class="sub-sidebar-inner d-flex flex-column"
        :style="{ width: subSidebarWidth + 'px' }"
      >
        <SidebarFileTree v-if="currentMode === SidebarMode.FileTree" />
        <SidebarUser v-else-if="currentMode === SidebarMode.User" />
        <SidebarSetting v-else />
      </div>
    </div>

    <div
      class="vertical-line turn-right col-drag"
      @mousedown.prevent="startResizing"
      :class="{ 'is-resizing': !showSubSidebar }"
    ></div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { SidebarMode } from "@/types/ui"
import { useResizablePane } from "@/composables/useResizablePane"
import { SIDEBAR_PANE_WIDTH } from "@/constants/ui"

import SidebarToggleIcon from "@/assets/icons/sidebar.svg"
import FileTreeIcon from "@/assets/icons/rectangle-list.svg"
import SettingIcon from "@/assets/icons/settings.svg"
import UserIcon from "@/assets/icons/user-pen.svg"

import SidebarFileTree from "@/components/sidebar/SidebarFileTree.vue"
import SidebarSetting from "@/components/sidebar/SidebarSetting.vue"
import SidebarUser from "@/components/sidebar/SidebarUser.vue"
import BaseHeader from '@/components/base/BaseHeader.vue';

const showSubSidebar = ref(true);
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

const sideBtns = [
  { icon: FileTreeIcon, func: () => { toggleSubSidebar(SidebarMode.FileTree); } },
  { icon: UserIcon, func: () => { toggleSubSidebar(SidebarMode.User); } },
  { icon: SettingIcon, func: () => { toggleSubSidebar(SidebarMode.Settings); } }
]

</script>

<style scoped>
.sidebar-wrapper {
  height: 100%;
  position: relative;
  user-select: none;
}

.sidebar-container {
  z-index: 2;
  background-color: var(--color-bg-sec);
  border-right: 1px solid var(--color-line);
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
</style>
