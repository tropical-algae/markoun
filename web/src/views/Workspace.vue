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

const nodeStore = useNodeStore()

onMounted(() => {
  void nodeStore.ensureWelcomeNoteLoaded().catch(() => null)
  window.addEventListener('pagehide', handlePageHide)
})

onBeforeUnmount(() => {
  window.removeEventListener('pagehide', handlePageHide)
})

onBeforeRouteLeave(async () => {
  await nodeStore.saveCurrentFileIfDirty()
})

const handlePageHide = () => {
  nodeStore.saveCurrentFileBeforeUnload()
}
</script>
