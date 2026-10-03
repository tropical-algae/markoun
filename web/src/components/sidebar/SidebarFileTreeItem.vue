<template>
  <div class="tree-node">
    <SidebarFileTreeNodeRow
      class="tree-node-row"
      :data-tree-node-path="node.path"
      v-model:edit-name="editName"
      :depth="depth"
      :name="node.name"
      :suffix="node.suffix"
      :icon="currentIcon"
      :is-directory="isDir"
      :selected="isActive"
      :opened="isOpened"
      :can-expand="canExpand"
      :drop-path="isDir ? node.path : undefined"
      :drag-over="isDirectoryDragOver"
      :dragging="isNodeDragging"
      :renaming="isRenaming"
      :set-rename-input-ref="setRenameInputRef"
      @click-node="handleClickNode"
      @click-directory-icon="handleClickDirectoryIcon"
      @drag-start="handleDragStart"
      @drag-end="handleNodeDragEnd"
      @pointer-down="startLongPress"
      @pointer-up="stopLongPress"
      @pointer-leave="stopLongPress"
      @pointer-cancel="stopLongPress"
      @submit-rename="submitRename"
      @cancel-rename="cancelRename"
    />

    <SidebarFileTreeBranch
      v-if="isDir"
      :path="node.path"
      :depth="depth + 1"
      :state="renderState"
      :nodes="normalizedChildren"
      @retry="retryDirectory"
      @node-opened="emit('nodeOpened')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FsNode } from '@/types/file-system'
import { useNodeStore } from '@/stores/note'
import { useWorkspaceActions } from '@/composables/useWorkspaceActions'
import { useFileTreeItemExpansion } from '@/composables/useFileTreeItemExpansion'
import { useFileTreeItemRename } from '@/composables/useFileTreeItemRename'
import { useFileTreeDropTargetState } from '@/composables/useFileTreeDropController'
import { useFileTreeNodeDrag } from '@/composables/useFileTreeNodeDrag'

import FolderOpenIcon from '@/assets/icons/folder-open.svg'
import FolderIcon from '@/assets/icons/folder.svg'
import SidebarFileTreeBranch from '@/components/sidebar/SidebarFileTreeBranch.vue'
import SidebarFileTreeNodeRow from '@/components/sidebar/SidebarFileTreeNodeRow.vue'

const nodeStore = useNodeStore()
const workspace = useWorkspaceActions()
const props = defineProps<{ node: FsNode, depth: number }>()
const emit = defineEmits<{
  (event: 'nodeOpened'): void
}>()

const node = computed(() => props.node)
const isDir = computed(() => node.value.type === 'dir')
const isActive = computed(() => nodeStore.selectedItem?.path === node.value.path)
const {
  renderState,
  isOpened,
  normalizedChildren,
  canExpand,
  retryDirectory,
} = useFileTreeItemExpansion(node, isDir)
const currentIcon = computed(() => isOpened.value ? FolderOpenIcon : FolderIcon)
const isDirectoryDragOver = useFileTreeDropTargetState(
  computed(() => isDir.value ? node.value.path : null),
)
const {
  editName,
  isRenaming,
  isLongPressed,
  setRenameInputRef,
  startLongPress,
  stopLongPress,
  submitRename,
  cancelRename,
} = useFileTreeItemRename(node, workspace.renameNode)
const {
  isNodeDragging,
  handleNodeDragStart,
  handleNodeDragEnd,
} = useFileTreeNodeDrag(node, () => !isRenaming.value)

const handleDragStart = (event: DragEvent) => {
  stopLongPress()
  handleNodeDragStart(event)
}

const handleClickNode = async () => {
  if (isLongPressed.value) {
    isLongPressed.value = false
    return
  }
  if (isRenaming.value) {
    return
  }

  if (isDir.value) {
    nodeStore.selectItem(node.value)
    if (canExpand.value) {
      await nodeStore.toggleDirectory(node.value).catch(() => null)
    }
    return
  }

  if (await workspace.openNode(node.value)) emit('nodeOpened')
}

const handleClickDirectoryIcon = async () => {
  if (isRenaming.value) {
    return
  }

  if (isActive.value) {
    nodeStore.clearSelection()
    return
  }

  nodeStore.selectItem(node.value)
}

</script>

<style scoped>
.tree-node,
.tree-node-row {
  width: 100%;
  min-width: 0;
}

.tree-node {
  position: relative;
}

</style>
