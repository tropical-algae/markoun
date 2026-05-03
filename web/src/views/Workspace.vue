<template>
  <div class="d-flex flex-column vh-100">
    <div class="workspace-header f-m fw-bold px-2 fc-pri">
      Markoun
    </div>

    <div class="d-flex flex-row flex-grow-1 overflow-auto">
      <Sidebar />
      <NoteEditor />
    </div>

    <div class="workspace-footer f-s px-2 fc-sec">
      &copy; 2026 tropical algae. MIT License
    </div>

  </div>

</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

import Sidebar from '@/components/sidebar/Sidebar.vue';
import NoteEditor from '@/components/editor/NoteEditor.vue';
import { useNodeStore } from '@/stores/note';

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

<style scoped>

.workspace-header {
  height: var(--icon-button-size);
  flex-shrink: 0;
	border-bottom: 1px solid var(--color-line);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  transition: border-color var(--motion-theme-duration) ease;
  /* justify-content: center; */
}

.workspace-footer {
  height: var(--icon-button-size);
  flex-shrink: 0;
	border-top: 1px solid var(--color-line);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  user-select: none;
  transition: border-color var(--motion-theme-duration) ease;
}
</style>
