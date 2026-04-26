<template>
  <div class="d-flex justify-content-center align-items-center gap-2 py-2">
    <button v-for="(item, _) in toolBtns" @click="item.func()">
      <component :is="item.icon" class="icon-btn"></component>
    </button>
  </div>
  <div class="px-2 flex-grow-1 overflow-y-scroll">
    <Transition name="soft-swap" mode="out-in">
      <div v-if="isRootLoading" key="tree-loading" class="tree-loading-state py-2">
        <div v-for="index in 6" :key="index" class="tree-skeleton-row">
          <BaseSkeleton width="1rem" height="1rem" radius="4px" />
          <BaseSkeleton
            :width="index % 2 === 0 ? '68%' : '54%'"
            height="1.2rem"
            radius="6px"
          />
        </div>
      </div>
      <div v-else key="tree-ready">
        <SidebarFileTreeItem v-for="item in nodeStore.rootNodes" :key="item.path" :node="item" :depth="0" />
      </div>
    </Transition>
  </div>

  <CreateNoteModal v-model="showNewNote"/>
  <CreateDirModal v-model="showNewFolder"/>
  <UploadFileModal v-model="showUpload"/>
  <DeleteItemModal v-model="deleteItem"/>
  <ImagePreviewModal />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"

import CreateNoteModal from "@/components/overlay/modals/CreateNoteModal.vue"
import CreateDirModal from "@/components/overlay/modals/CreateDirModal.vue"
import UploadFileModal from "@/components/overlay/modals/UploadFileModal.vue"
import DeleteItemModal from "@/components/overlay/modals/DeleteItemModal.vue"
import ImagePreviewModal from "@/components/overlay/modals/ImagePreviewModal.vue"

import SidebarFileTreeItem from "@/components/sidebar/SidebarFileTreeItem.vue"
import BaseSkeleton from "@/components/base/BaseSkeleton.vue"

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
const isRootLoading = computed(() => nodeStore.getDirectoryLoadState('.') === 'loading' && nodeStore.rootNodes.length === 0)

const toolBtns = [
  { icon: NewNoteIcon, func: () => { showNewNote.value = true } },
  { icon: NewFolderIcon, func: () => { showNewFolder.value = true } },
  { icon: UploadIcon, func: () => { showUpload.value = true } },
  { icon: TrashIcon, func: () => { deleteItem.value = true } },
]



onMounted(async () => {
  await nodeStore.loadDirectory()
})
</script>

<style scoped>
.tree-loading-state {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tree-skeleton-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
}
</style>
