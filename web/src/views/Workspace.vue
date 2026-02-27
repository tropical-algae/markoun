<template>
  <div class="d-flex flex-column vh-100">
    <div class="workspace-header small fw-bold px-2">
      Markoun
    </div>

    <div class="d-flex flex-row flex-grow-1 overflow-auto">
      <Sidebar />
      <NoteEditor />
    </div>

    <div class="workspace-footer text-muted px-2">
      &copy; 2026 tropical algae. MIT License
    </div>

  </div>

</template>

<script setup lang="ts">
import Sidebar from '@/components/sidebar/Sidebar.vue';
import NoteEditor from '@/components/editor/NoteEditor.vue';


</script>