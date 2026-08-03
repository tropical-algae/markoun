<template>
  <WorkspaceLayout
    :left-open="panes.isLeftOpen.value"
    :right-open="panes.isRightOpen.value"
  >
    <template #rail>
      <SidebarRail
        :panel-open="panes.isLeftOpen.value"
        :current-mode="sidebarMode"
        @toggle="toggleSidebar"
      />
    </template>

    <template #left-pane>
      <SidebarPanel
        :current-mode="sidebarMode"
        @node-opened="panes.closeLeftOnCompact"
      />
    </template>

    <NoteEditor
      :inspector-open="panes.isRightOpen.value"
      :inspector-mode="inspectorMode"
      @toggle-inspector="toggleInspector"
    />

    <template #right-pane>
      <Inspector
        :mode="inspectorMode"
        @close="panes.setRightOpen(false)"
      />
    </template>
  </WorkspaceLayout>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import WorkspaceLayout from '@/layouts/WorkspaceLayout.vue'
import SidebarRail from '@/components/sidebar/SidebarRail.vue'
import SidebarPanel from '@/components/sidebar/SidebarPanel.vue'
import NoteEditor from '@/components/editor/NoteEditor.vue'
import Inspector from '@/components/inspector/Inspector.vue'
import { useWorkspacePanes } from '@/layouts/useWorkspacePanes'
import {
  InspectorMode,
  SidebarMode,
  type InspectorMode as InspectorModeType,
} from '@/types/ui'
import { useNodeStore } from '@/stores/note'
import { useSysStore } from '@/stores/system'
import { useUserStore } from '@/stores/user'

const nodeStore = useNodeStore()
const sysStore = useSysStore()
const userStore = useUserStore()
const panes = useWorkspacePanes()
const sidebarMode = ref<SidebarMode>(SidebarMode.FileTree)
const inspectorMode = ref<InspectorModeType>(InspectorMode.Meta)

const toggleSidebar = async (mode?: SidebarMode) => {
  if (mode === undefined) {
    panes.setLeftOpen(!panes.isLeftOpen.value)
    return
  }

  const shouldOpen = sidebarMode.value !== mode || !panes.isLeftOpen.value
  const modeChanged = sidebarMode.value !== mode
  sidebarMode.value = mode

  if (shouldOpen && modeChanged && !panes.isLeftOpen.value) {
    await nextTick()
  }
  panes.setLeftOpen(shouldOpen)
}

const toggleInspector = async (mode: InspectorModeType) => {
  const shouldOpen = inspectorMode.value !== mode || !panes.isRightOpen.value
  const modeChanged = inspectorMode.value !== mode
  inspectorMode.value = mode

  if (shouldOpen && modeChanged && !panes.isRightOpen.value) {
    await nextTick()
  }
  panes.setRightOpen(shouldOpen)
}

onMounted(() => {
  void nodeStore.ensureWelcomeNoteLoaded().catch(() => null)
  window.addEventListener('pagehide', handlePageHide)
})

onBeforeUnmount(() => {
  window.removeEventListener('pagehide', handlePageHide)
  nodeStore.resetWorkspaceState()
})

onBeforeRouteLeave(async () => {
  if (sysStore.authRequired && !userStore.isAuthenticated) {
    return
  }
  await nodeStore.saveCurrentFileIfDirty()
})

const handlePageHide = () => {
  nodeStore.saveCurrentFileBeforeUnload()
}
</script>
