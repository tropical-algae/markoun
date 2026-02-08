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
      :class="{ 'anim-width': !isSubSidebarResizing }"
      :style="{ width: currentWidth }"
    >
      <div 
        class="sub-sidebar-inner d-flex flex-column pt-2"
        :style="{ width: subSidebarWidth + 'px' }"
      >
        <FileTreeComp v-if="currentMode === SidebarMode.FileTree" />
        <div v-else></div>
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
import { ref, computed } from "vue"
import { SidebarMode } from "@/scripts/types"

import SidebarToggleIcon from "@/assets/icons/sidebar.svg"
import FileTreeIcon from "@/assets/icons/rectangle-list.svg"
import SettingIcon from "@/assets/icons/settings.svg"

import FileTreeComp from "@/components/FileTreeComp.vue"
import BaseHeader from '@/components/common/BaseHeader.vue';


const subSidebarWidth = ref(250);
const subSidebarMinWidth = 220;
const subSidebarMaxWidth = 500;
const isSubSidebarResizing = ref(false);
const showSubSidebar = ref(true);

const currentMode = ref<SidebarMode>(SidebarMode.FileTree)
const currentWidth = computed(() => showSubSidebar.value ? `${subSidebarWidth.value}px` : '0px');

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
  { icon: SettingIcon, func: () => { toggleSubSidebar(SidebarMode.Settings); } }
]

const startResizing = (e: MouseEvent) => {
  isSubSidebarResizing.value = true;
  const startX = e.clientX;
  const startWidth = subSidebarWidth.value;

  const onMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - startX;
    let newWidth = startWidth + deltaX;

    if (newWidth < subSidebarMinWidth) newWidth = subSidebarMinWidth;
    if (newWidth > subSidebarMaxWidth) newWidth = subSidebarMaxWidth;

    subSidebarWidth.value = newWidth;
  };

  const onMouseUp = () => {
    isSubSidebarResizing.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};



</script>


