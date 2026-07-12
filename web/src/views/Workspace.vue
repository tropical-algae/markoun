<template>
  <div class="workspace-shell d-flex flex-column">
    <div class="workspace-header f-m fw-bold px-2 fc-pri">
      Markoun
    </div>

    <div class="workspace-main d-flex flex-row flex-grow-1 overflow-hidden">
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
  min-height: var(--icon-button-size);
  padding-top: var(--safe-area-top);
  padding-left: calc(0.5rem + var(--safe-area-left)) !important;
  padding-right: calc(0.5rem + var(--safe-area-right)) !important;
  flex-shrink: 0;
	border-bottom: 1px solid var(--color-line);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  transition: border-color var(--motion-theme-duration) ease;
  /* justify-content: center; */
}

.workspace-footer {
  min-height: var(--icon-button-size);
  padding-bottom: var(--safe-area-bottom);
  padding-left: calc(0.5rem + var(--safe-area-left)) !important;
  padding-right: calc(0.5rem + var(--safe-area-right)) !important;
  flex-shrink: 0;
	border-top: 1px solid var(--color-line);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  user-select: none;
  transition: border-color var(--motion-theme-duration) ease;
}

.workspace-shell {
  height: 100dvh;
  min-height: 0;
}

.workspace-main {
  min-height: 0;
  position: relative;
}

@media (max-width: 768px) {
  .workspace-main {
    flex-direction: column !important;
  }
}
</style>
