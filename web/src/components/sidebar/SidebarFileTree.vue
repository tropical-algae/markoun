<template>
  <SidebarPanelLayout>
    <template #header>
      <div class="sidebar-toolbar">
        <BaseTooltip
          v-for="item in toolBtns"
          :key="item.label"
          :text="item.label"
          placement="bottom"
        >
          <button class="icon-btn" @click="item.func()" :aria-label="item.label">
            <component :is="item.icon"></component>
          </button>
        </BaseTooltip>
      </div>
    </template>

    <div
      class="file-tree-root sidebar-panel-body"
      :class="{ 'is-root-dragover': isRootDirectoryDragOver }"
      @dragenter.prevent="handleRootDirectoryDragEnter"
      @dragover.prevent="handleRootDirectoryDragOver"
      @dragleave.prevent="handleRootDirectoryDragLeave"
      @drop.prevent="handleRootDirectoryDrop"
    >
      <AsyncGate :status="rootLoadStatus">
        <template #loading>
          <SidebarFileTreeSkeleton :rows="6" />
        </template>

        <div class="file-tree-list">
          <SidebarFileTreeItem
            v-for="item in nodeStore.rootNodes"
            :key="item.path"
            :node="item"
            :depth="0"
            @node-opened="emit('nodeOpened')"
          />
        </div>
      </AsyncGate>
    </div>

    <CreateNodeModal
      v-model="showNewNote"
      v-bind="createNoteModalConfig"
    />
    <CreateNodeModal
      v-model="showNewFolder"
      v-bind="createFolderModalConfig"
    />
    <UploadFileModal v-model="showUpload" />
    <DeleteItemModal v-model="deleteItem" />
    <ImagePreviewModal />
  </SidebarPanelLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import CreateNodeModal from '@/components/overlay/modals/CreateNodeModal.vue'
import UploadFileModal from '@/components/overlay/modals/UploadFileModal.vue'
import DeleteItemModal from '@/components/overlay/modals/DeleteItemModal.vue'
import ImagePreviewModal from '@/components/overlay/modals/ImagePreviewModal.vue'

import SidebarFileTreeItem from '@/components/sidebar/SidebarFileTreeItem.vue'
import SidebarFileTreeSkeleton from '@/components/sidebar/SidebarFileTreeSkeleton.vue'
import AsyncGate from '@/components/base/AsyncGate.vue'
import BaseTooltip from '@/components/base/BaseTooltip.vue'
import SidebarPanelLayout from '@/layouts/SidebarPanelLayout.vue'

import NewNoteIcon from '@/assets/icons/add-document.svg'
import NewFolderIcon from '@/assets/icons/folder-plus-circle.svg'
import UploadIcon from '@/assets/icons/cloud-upload-alt.svg'
import TrashIcon from '@/assets/icons/trash.svg'

import { useNodeStore } from '@/stores/note'
import type { AsyncStatus } from '@/types/async'
import { useFileTreeDropTarget } from '@/composables/useFileTreeDropTarget'
import { ROOT_DIRECTORY_PATH } from '@/utils/file-system'

const emit = defineEmits<{
  (event: 'nodeOpened'): void
}>()

const showNewNote = ref(false)
const showNewFolder = ref(false)
const showUpload = ref(false)
const deleteItem = ref(false)
const nodeStore = useNodeStore()
const rootLoadStatus = computed<AsyncStatus>(() => {
  const state = nodeStore.getDirectoryLoadState(ROOT_DIRECTORY_PATH)
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
  isDirectory: true,
  getDestinationPath: () => ROOT_DIRECTORY_PATH,
  moveNode: nodeStore.moveNode,
})

const toolBtns = [
  { icon: NewNoteIcon, label: 'New note', func: () => { showNewNote.value = true } },
  { icon: NewFolderIcon, label: 'New folder', func: () => { showNewFolder.value = true } },
  { icon: UploadIcon, label: 'Upload file', func: () => { showUpload.value = true } },
  { icon: TrashIcon, label: 'Delete item', func: () => { deleteItem.value = true } },
] as const

const createNoteModalConfig = {
  title: 'New Note',
  inputLabel: 'Note Name',
  placeholder: 'e.g. my_note',
  hint: 'Created in the selected path. No extension needed.',
  nodeType: 'file',
} as const

const createFolderModalConfig = {
  title: 'New Folder',
  inputLabel: 'Folder Name',
  placeholder: 'e.g. temp_folder',
  hint: 'Created in the selected path.',
  nodeType: 'dir',
} as const

onMounted(async () => {
  await nodeStore.loadDirectory()
})
</script>

<style scoped>
.file-tree-root {
  display: flex;
  flex-direction: column;
  transition: background-color var(--motion-soft-duration) ease;
  border-radius: var(--radius-sm);
}

.file-tree-list {
  margin-bottom: var(--space-xl);
}

.file-tree-root.is-root-dragover {
  background-color: var(--color-action-light);
  box-shadow: inset 0 0 0 var(--line-width) var(--color-action);
}
</style>
