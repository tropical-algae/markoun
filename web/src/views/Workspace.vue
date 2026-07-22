<template>
  <WorkspaceLayout>
    <template #sidebar>
      <Sidebar />
    </template>

    <NoteEditor />
  </WorkspaceLayout>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import WorkspaceLayout from '@/layouts/WorkspaceLayout.vue'
import Sidebar from '@/components/sidebar/Sidebar.vue'
import NoteEditor from '@/components/editor/NoteEditor.vue'
import { useNodeStore } from '@/stores/note'
import { useSysStore } from '@/stores/system'
import { useUserStore } from '@/stores/user'

const nodeStore = useNodeStore()
const sysStore = useSysStore()
const userStore = useUserStore()

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
