<template>
  <SidebarPanelLayout>
    <template #header>
      <div class="sidebar-toolbar">
        <BaseTooltip
          v-for="action in toolbarActions"
          :key="action"
          :text="actions[action].label"
          placement="bottom"
        >
          <button
            type="button"
            class="icon-btn"
            :disabled="action === 'delete' && !nodeStore.selectedItem"
            @click="openToolbarAction(action)"
            :aria-label="actions[action].label"
          >
            <component :is="actions[action].icon" />
          </button>
        </BaseTooltip>
      </div>
    </template>

    <div
      ref="fileTreeRootRef"
      class="file-tree-root sidebar-panel-body"
      :class="{ 'is-root-dragover': isRootDirectoryDragOver }"
      :data-tree-drop-path="ROOT_DIRECTORY_PATH"
      @dragover.capture="handleTreeDragOver"
      @dragleave.capture="handleTreeDragLeave"
      @drop.capture="handleTreeDrop"
      @dragstart.capture="closeMenu()"
      @dragend.capture="clearTreeDropTarget"
      @contextmenu="handleContextMenu"
      @keydown="handleContextKey"
      @click="handleMenuButtonClick"
      @scroll.passive="closeMenu()"
    >
      <div ref="fileTreeLayoutRef" class="file-tree-layout">
        <SidebarFileTreeStateGate :status="rootLoadStatus">
          <template #loading>
            <SidebarFileTreeSkeleton :rows="6" />
          </template>

          <template #error>
            <button type="button" class="file-tree-error f-xs" @click="retryRootDirectory">
              Unable to load files. Retry
            </button>
          </template>

          <div class="file-tree-list" :data-tree-drop-path="ROOT_DIRECTORY_PATH">
            <SidebarFileTreeItem
              v-for="item in nodeStore.rootNodes"
              :key="item.path"
              :node="item"
              :depth="0"
              @node-opened="emit('nodeOpened')"
            />
          </div>
        </SidebarFileTreeStateGate>
      </div>
    </div>

    <BaseContextMenu
      v-if="menu"
      :point="menu.point"
      :align="menu.align"
      :label="`Actions for ${menu.node.name}`"
      @dismiss="closeMenu"
    >
      <button
        v-for="action in menuActions"
        :key="action"
        type="button"
        role="menuitem"
        tabindex="-1"
        class="context-menu-item"
        :class="{ 'is-danger': action === 'delete' }"
        @click="openMenuAction(action)"
      >
        {{ actions[action].label }}
      </button>
    </BaseContextMenu>

    <NodeNameModal
      :model-value="dialogOpen && nameOperation !== null"
      :operation="nameOperation"
      @update:model-value="dialogOpen = $event"
    />
    <UploadFileModal
      :model-value="dialogOpen && dialog?.kind === 'upload'"
      :parent-path="dialog?.kind === 'upload' ? dialog.parentPath : ROOT_DIRECTORY_PATH"
      @update:model-value="dialogOpen = $event"
    />
    <DeleteItemModal
      :model-value="dialogOpen && dialog?.kind === 'delete'"
      :target="dialog?.kind === 'delete' ? dialog.target : null"
      @update:model-value="dialogOpen = $event"
    />
    <ImagePreviewModal />
  </SidebarPanelLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'

import NodeNameModal, { type NodeNameOperation } from '@/components/overlay/modals/NodeNameModal.vue'
import UploadFileModal from '@/components/overlay/modals/UploadFileModal.vue'
import DeleteItemModal from '@/components/overlay/modals/DeleteItemModal.vue'
import ImagePreviewModal from '@/components/overlay/modals/ImagePreviewModal.vue'

import SidebarFileTreeItem from '@/components/sidebar/SidebarFileTreeItem.vue'
import SidebarFileTreeSkeleton from '@/components/sidebar/SidebarFileTreeSkeleton.vue'
import SidebarFileTreeStateGate from '@/components/sidebar/SidebarFileTreeStateGate.vue'
import BaseTooltip from '@/components/base/BaseTooltip.vue'
import BaseContextMenu from '@/components/base/BaseContextMenu.vue'
import SidebarPanelLayout from '@/layouts/SidebarPanelLayout.vue'

import NewNoteIcon from '@/assets/icons/add-document.svg'
import NewFolderIcon from '@/assets/icons/folder-plus-circle.svg'
import UploadIcon from '@/assets/icons/cloud-upload-alt.svg'
import TrashIcon from '@/assets/icons/trash.svg'

import { useNodeStore } from '@/stores/note'
import { useWorkspaceActions } from '@/composables/useWorkspaceActions'
import type { AsyncStatus } from '@/types/async'
import type { SelectedItem } from '@/types/file-system'
import { useFileTreeContextMenu } from '@/composables/useFileTreeContextMenu'
import { provideFileTreeDropController } from '@/composables/useFileTreeDropController'
import { provideFileTreeMotion } from '@/composables/useFileTreeMotion'
import { ROOT_DIRECTORY_PATH } from '@/utils/file-system'

const emit = defineEmits<{
  (event: 'nodeOpened'): void
}>()

type FileTreeDialog = NodeNameOperation
  | { kind: 'upload', parentPath: string }
  | { kind: 'delete', target: SelectedItem }

const dialog = shallowRef<FileTreeDialog | null>(null)
const dialogOpen = ref(false)
const nameOperation = computed(() => {
  const active = dialog.value
  return active?.kind === 'create' || active?.kind === 'rename' ? active : null
})
const fileTreeRootRef = ref<HTMLElement | null>(null)
const fileTreeLayoutRef = ref<HTMLElement | null>(null)
const nodeStore = useNodeStore()
const workspace = useWorkspaceActions()
const {
  menu,
  closeMenu,
  handleContextMenu,
  handleContextKey,
  handleMenuButtonClick,
} = useFileTreeContextMenu(nodeStore.getCachedNode)
const motion = provideFileTreeMotion(fileTreeRootRef, fileTreeLayoutRef)
watch(() => nodeStore.rootNodes, (children, previousChildren) => {
  if (
    children.length !== previousChildren.length
    || children.some((child, index) => child.path !== previousChildren[index]?.path)
  ) {
    motion.beforeLayoutChange(ROOT_DIRECTORY_PATH)
  }
})
const rootLoadStatus = computed<AsyncStatus>(() => {
  const state = nodeStore.getDirectoryLoadState(ROOT_DIRECTORY_PATH)
  if (state === 'loaded') {
    return 'ready'
  }
  return state
})
const retryRootDirectory = () => {
  void nodeStore.retryDirectory(ROOT_DIRECTORY_PATH).catch(() => null)
}
const {
  activeDropPath,
  clearDropTarget: clearTreeDropTarget,
  handleDragOver: handleTreeDragOver,
  handleDragLeave: handleTreeDragLeave,
  handleDrop: handleTreeDrop,
} = provideFileTreeDropController({
  rootElement: fileTreeRootRef,
  moveNode: workspace.moveNode,
  selectDirectory: async (path) => {
    if (path === ROOT_DIRECTORY_PATH) {
      return
    }
    const node = nodeStore.getCachedNode(path)
    if (node?.type === 'dir') {
      nodeStore.selectItem(node)
    }
  },
})
const isRootDirectoryDragOver = computed(() => activeDropPath.value === ROOT_DIRECTORY_PATH)

const actions = {
  newNote: { icon: NewNoteIcon, label: 'New note' },
  newFolder: { icon: NewFolderIcon, label: 'New folder' },
  upload: { icon: UploadIcon, label: 'Upload file' },
  rename: { label: 'Rename' },
  delete: { icon: TrashIcon, label: 'Delete item' },
} as const
const directoryActions = ['newNote', 'newFolder', 'upload'] as const
const toolbarActions = [...directoryActions, 'delete'] as const
const menuActions = computed<readonly (keyof typeof actions)[]>(() => (
  menu.value?.node.type === 'dir'
    ? [...directoryActions, 'rename', 'delete']
    : ['rename', 'delete']
))

const openDialog = (next: FileTreeDialog) => {
  dialog.value = next
  dialogOpen.value = true
}

const openDirectoryAction = (action: typeof directoryActions[number], parentPath: string) => {
  if (action === 'upload') {
    openDialog({ kind: 'upload', parentPath })
  } else {
    openDialog({ kind: 'create', nodeType: action === 'newNote' ? 'file' : 'dir', parentPath })
  }
}

const openToolbarAction = (action: typeof toolbarActions[number]) => {
  if (action === 'delete') {
    const target = nodeStore.selectedItem
    if (target) openDialog({ kind: 'delete', target })
  } else {
    openDirectoryAction(action, nodeStore.currentParentPath)
  }
}

const openMenuAction = (action: keyof typeof actions) => {
  const target = menu.value?.node
  if (!target) return
  closeMenu(true)
  if (action === 'rename' || action === 'delete') {
    openDialog({ kind: action, target })
  } else if (target.type === 'dir') {
    openDirectoryAction(action, target.path)
  }
}

onMounted(() => {
  void nodeStore.loadDirectory().catch(() => null)
})
</script>

<style scoped>
.file-tree-root {
  position: relative;
  display: flex;
  flex-direction: column;
  contain: layout;
  transition: background-color var(--motion-soft-duration) ease;
  border-radius: var(--radius-sm);
  isolation: isolate;
  overflow-anchor: none;
}

.file-tree-layout {
  flex: 0 0 auto;
  min-width: 0;
}

.file-tree-root::after {
  position: absolute;
  inset: 0;
  z-index: 2;
  border: var(--line-width) solid transparent;
  border-radius: inherit;
  box-sizing: border-box;
  content: "";
  pointer-events: none;
  transition: border-color var(--motion-soft-duration) ease;
}

.file-tree-list {
  margin-bottom: var(--space-xl);
}

.file-tree-error {
  width: 100%;
  padding: var(--space-md);
  border: 0;
  color: var(--color-text-sec);
  background: transparent;
  cursor: pointer;
}

.file-tree-root.is-root-dragover {
  background-color: var(--color-action-light);
}

.file-tree-root.is-root-dragover::after {
  border-color: var(--color-action);
}
</style>
