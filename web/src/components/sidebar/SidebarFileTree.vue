<template>
  <div class="d-flex justify-content-center align-items-center gap-2 py-2">
    <button v-for="(item, _) in toolBtns" @click="item.func()">
      <component :is="item.icon" class="icon-btn"></component>
    </button>
  </div>
  <div class="px-2 flex-grow-1 overflow-y-scroll">
    <SidebarFileTreeItem v-for="item in nodeStore.nodeTree" :key="item.path" :node="item" :depth="0" />
  </div>

  <CreateNoteModal v-model="showNewNote"/>
  <CreateDirModal v-model="showNewFolder"/>
  <UploadFileModal v-model="showUpload"/>
  <DeleteItemModal v-model="deleteItem"/>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"

import CreateNoteModal from "@/components/overlay/modals/CreateNoteModal.vue"
import CreateDirModal from "@/components/overlay/modals/CreateDirModal.vue"
import UploadFileModal from "@/components/overlay/modals/UploadFileModal.vue"
import DeleteItemModal from "@/components/overlay/modals/DeleteItemModal.vue"

import SidebarFileTreeItem from "@/components/sidebar/SidebarFileTreeItem.vue"

import NewNoteIcon from "@/assets/icons/add-document.svg"
import NewFolderIcon from "@/assets/icons/folder-plus-circle.svg"
import UploadIcon from "@/assets/icons/cloud-upload-alt.svg"
import TrashIcon from "@/assets/icons/trash.svg"

import { useNodeStore } from "@/stores/note"

const showNewNote = ref(false);
const showNewFolder = ref(false);
const showUpload = ref(false);
const deleteItem = ref(false);
const nodeStore = useNodeStore()

const toolBtns = [
  { icon: NewNoteIcon, func: () => { showNewNote.value = true } },
  { icon: NewFolderIcon, func: () => { showNewFolder.value = true } },
  { icon: UploadIcon, func: () => { showUpload.value = true } },
  { icon: TrashIcon, func: () => { deleteItem.value = true } },
]



onMounted(async () => {
  await nodeStore.refrestNodeTree()
})
</script>