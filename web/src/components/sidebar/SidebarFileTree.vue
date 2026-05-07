<template>
  <BaseHeader class="p-0">
    <div class="d-flex justify-content-center align-items-center gap-2 py-2">
      <BaseTooltip v-for="item in toolBtns" :key="item.label" :text="item.label" placement="bottom">
        <button @click="item.func()" :aria-label="item.label">
          <component :is="item.icon" class="icon-btn"></component>
        </button>
      </BaseTooltip>
    </div>
  </BaseHeader>
  
  <div
    class="file-tree-root flex-grow-1 overflow-y-scroll p-0 my-3"
    :class="{ 'is-root-dragover': isRootDirectoryDragOver }"
    @dragenter.prevent="handleRootDirectoryDragEnter"
    @dragover.prevent="handleRootDirectoryDragOver"
    @dragleave.prevent="handleRootDirectoryDragLeave"
    @drop.prevent="handleRootDirectoryDrop"
  >
    <AsyncGate :status="rootLoadStatus">
      <template #loading>
        <div class="tree-loading-state py-2">
          <div v-for="index in 6" :key="index" class="tree-skeleton-row">
            <BaseSkeleton width="1rem" height="1rem" radius="4px" />
            <BaseSkeleton
              :width="index % 2 === 0 ? '68%' : '54%'"
              height="1.2rem"
              radius="6px"
            />
          </div>
        </div>
      </template>

      <div class="mb-4">
        <SidebarFileTreeItem
          v-for="item in nodeStore.rootNodes"
          :key="item.path"
          :node="item"
          :depth="0"
        />
      </div>
    </AsyncGate>
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

import BaseHeader from '@/components/base/BaseHeader.vue';
import SidebarFileTreeItem from "@/components/sidebar/SidebarFileTreeItem.vue"
import AsyncGate from "@/components/base/AsyncGate.vue"
import BaseSkeleton from "@/components/base/BaseSkeleton.vue"
import BaseTooltip from "@/components/base/BaseTooltip.vue"

import NewNoteIcon from "@/assets/icons/add-document.svg"
import NewFolderIcon from "@/assets/icons/folder-plus-circle.svg"
import UploadIcon from "@/assets/icons/cloud-upload-alt.svg"
import TrashIcon from "@/assets/icons/trash.svg"

import { useNodeStore } from "@/stores/note"
import type { AsyncStatus } from "@/types/async"
import { useFileTreeDropTarget } from "@/composables/useFileTreeDropTarget"
import { ROOT_DIRECTORY_PATH } from "@/utils/file-system"

const showNewNote = ref(false);
const showNewFolder = ref(false);
const showUpload = ref(false);
const deleteItem = ref(false);
const nodeStore = useNodeStore()
const isRootDirectory = computed(() => true)
const rootLoadStatus = computed<AsyncStatus>(() => {
  const state = nodeStore.getDirectoryLoadState('.')
  if (state === 'loaded') {
    return 'ready'
  }
  return state
})
const {
  isDirectoryDragOver: isRootDirectoryDragOver,
  handleDirectoryDragEnter: handleRootDirectoryDragEnter,
  handleDirectoryDragOver: handleRootDirectoryDragOver,
  handleDirectoryDragLeave: handleRootDirectoryDragLeave,
  handleDirectoryDrop: handleRootDirectoryDrop,
} = useFileTreeDropTarget({
  isDirectory: isRootDirectory,
  getDestinationPath: () => ROOT_DIRECTORY_PATH,
  moveNode: nodeStore.moveNode,
})

const toolBtns = [
  { icon: NewNoteIcon, label: 'New note', func: () => { showNewNote.value = true } },
  { icon: NewFolderIcon, label: 'New folder', func: () => { showNewFolder.value = true } },
  { icon: UploadIcon, label: 'Upload file', func: () => { showUpload.value = true } },
  { icon: TrashIcon, label: 'Delete item', func: () => { deleteItem.value = true } },
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
  padding: var(--tree-row-padding);
}

.file-tree-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: background-color var(--motion-soft-duration) ease;
  border-radius: var(--tree-row-radius);
}

.file-tree-root.is-root-dragover {
  background-color: var(--color-action-light);
  box-shadow: 0 0 0 1px var(--color-action);
}
</style>
