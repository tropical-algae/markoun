<template>
  <div class="sidebar-rail">
    <BaseHeader>
      <div class="sidebar-toolbar">
        <BaseTooltip text="Toggle sidebar" :placement="sidebarTooltipPlacement">
          <button
            type="button"
            class="icon-btn"
            aria-label="Toggle sidebar"
            :aria-expanded="panelOpen"
            @click="emit('toggle')"
          >
            <component :is="SidebarToggleIcon"></component>
          </button>
        </BaseTooltip>
      </div>
    </BaseHeader>

    <div class="sidebar-nav">
      <BaseTooltip
        v-for="item in sideBtns"
        :key="item.label"
        :text="item.label"
        :placement="sidebarTooltipPlacement"
      >
        <button
          type="button"
          class="sidebar-nav-button icon-btn"
          :class="{ 'is-active': currentMode === item.mode && panelOpen }"
          :aria-label="item.label"
          :aria-pressed="currentMode === item.mode && panelOpen"
          @click="emit('toggle', item.mode)"
        >
          <component :is="item.icon"></component>
        </button>
      </BaseTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SidebarMode } from '@/types/ui'
import { useSysStore } from '@/stores/system'

import SidebarToggleIcon from '@/assets/icons/sidebar.svg'
import FileTreeIcon from '@/assets/icons/rectangle-list.svg'
import SearchIcon from '@/assets/icons/analytics-magnifying-glass.svg'
import SettingIcon from '@/assets/icons/settings.svg'
import UserIcon from '@/assets/icons/portrait.svg'

import BaseHeader from '@/components/base/BaseHeader.vue'
import BaseTooltip from '@/components/base/BaseTooltip.vue'

defineProps<{
  panelOpen: boolean
  currentMode: SidebarMode
}>()

const emit = defineEmits<{
  (event: 'toggle', mode?: SidebarMode): void
}>()

const sysStore = useSysStore()
const sidebarTooltipPlacement = 'right'
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
.sidebar-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
}

.sidebar-rail :deep(.base-header) {
  width: 100%;
}

.sidebar-rail :deep(.container-header) {
  justify-content: center;
}

.sidebar-nav {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: var(--space-sm);
  justify-content: flex-start;
  margin-block: var(--space-lg);
}

.sidebar-nav-button.is-active {
  fill: var(--color-action);
}
</style>
