<template>
  <SidebarLayout>
    <template #rail-header>
      <BaseHeader>
        <div class="sidebar-toolbar">
          <BaseTooltip text="Toggle sidebar" :placement="sidebarTooltipPlacement">
            <button
              class="icon-btn"
              @click="toggleSubSidebar()"
              aria-label="Toggle sidebar"
              :aria-expanded="showSubSidebar"
            >
              <component :is="SidebarToggleIcon"></component>
            </button>
          </BaseTooltip>
        </div>
      </BaseHeader>
    </template>

    <template #rail>
      <div class="sidebar-nav">
        <BaseTooltip
          v-for="item in sideBtns"
          :key="item.label"
          :text="item.label"
          :placement="sidebarTooltipPlacement"
        >
          <button
            class="sidebar-nav-button icon-btn"
            :class="{ 'is-active': currentMode === item.mode && showSubSidebar }"
            @click="toggleSubSidebar(item.mode)"
            :aria-label="item.label"
            :aria-pressed="currentMode === item.mode && showSubSidebar"
          >
            <component :is="item.icon"></component>
          </button>
        </BaseTooltip>
      </div>
    </template>

    <template #panel>
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
    </template>
  </SidebarLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { SidebarMode } from '@/types/ui'
import { useWorkspaceLayout } from '@/layouts/workspace-context'
import { useSysStore } from '@/stores/system'

import SidebarToggleIcon from '@/assets/icons/sidebar.svg'
import FileTreeIcon from '@/assets/icons/rectangle-list.svg'
import SearchIcon from '@/assets/icons/analytics-magnifying-glass.svg'
import SettingIcon from '@/assets/icons/settings.svg'
import UserIcon from '@/assets/icons/portrait.svg'

import SidebarFileTree from '@/components/sidebar/SidebarFileTree.vue'
import SidebarSearch from '@/components/sidebar/SidebarSearch.vue'
import SidebarSetting from '@/components/sidebar/SidebarSetting.vue'
import SidebarUser from '@/components/sidebar/SidebarUser.vue'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import BaseHeader from '@/components/base/BaseHeader.vue'
import BaseTooltip from '@/components/base/BaseTooltip.vue'

const {
  isSidebarPanelOpen,
  setSidebarPanelOpen,
  closeSidebarPanelOnCompact,
} = useWorkspaceLayout()
const sysStore = useSysStore()

const showSubSidebar = computed({
  get: () => isSidebarPanelOpen.value,
  set: setSidebarPanelOpen,
})
const sidebarTooltipPlacement = 'right'

const currentMode = ref<SidebarMode>(SidebarMode.FileTree)

const toggleSubSidebar = (mode: SidebarMode | null = null) => {
  if (mode === null) {
    showSubSidebar.value = !showSubSidebar.value
    return
  }

  const shouldExpand = currentMode.value !== mode || !showSubSidebar.value
  showSubSidebar.value = shouldExpand
  if (shouldExpand) {
    currentMode.value = mode
  }
}

const handleContentOpen = () => {
  closeSidebarPanelOnCompact()
}

const sideBtns = computed(() => [
  { icon: FileTreeIcon, label: 'Files', mode: SidebarMode.FileTree },
  { icon: SearchIcon, label: 'Search', mode: SidebarMode.Search },
  ...(sysStore.authRequired
    ? [{ icon: UserIcon, label: 'Profile', mode: SidebarMode.User }]
    : []),
  { icon: SettingIcon, label: 'Settings', mode: SidebarMode.Settings },
])

</script>

<style scoped>
.sidebar-nav {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: var(--layout-sidebar-nav-gap);
  justify-content: flex-start;
  margin-block: var(--layout-sidebar-nav-margin-y);
}

.sidebar-nav-button.is-active {
  fill: var(--color-action);
}
</style>
