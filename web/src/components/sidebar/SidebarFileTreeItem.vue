<template>
  <m.div
    layout="position"
    :layout-id="node.path"
    :initial="treeMotion.itemInitial.value"
    :animate="treeMotion.itemVisible.value"
    :transition="{
      layout: treeMotion.transition.value,
      default: treeMotion.transition.value,
    }"
    class="tree-node-motion"
  >
    <SidebarFileTreeNodeRow
      v-model:edit-name="editName"
      :depth="depth"
      :name="node.name"
      :suffix="node.suffix"
      :icon="currentIcon"
      :is-directory="isDir"
      :selected="isActive"
      :opened="isOpened"
      :can-expand="canExpand"
      :drag-over="isDirectoryDragOver"
      :dragging="isNodeDragging"
      :renaming="isRenaming"
      :set-rename-input-ref="setRenameInputRef"
      @click-node="handleClickNode"
      @click-directory-icon="handleClickDirectoryIcon"
      @drag-start="handleDragStart"
      @drag-end="handleNodeDragEnd"
      @drag-enter="handleDirectoryDragEnter"
      @drag-over="handleDirectoryDragOver"
      @drag-leave="handleDirectoryDragLeave"
      @drop="handleDirectoryDrop"
      @pointer-down="startLongPress"
      @pointer-up="stopLongPress"
      @pointer-leave="stopLongPress"
      @pointer-cancel="stopLongPress"
      @submit-rename="submitRename"
      @cancel-rename="cancelRename"
    />

    <div v-if="isDir && isOpened" class="node-children-panel">
      <div class="node-children-state">
        <AsyncGate
          :status="childLoadStatus"
          class="tree-node-state-layer"
          transition-name="tree-node-swap"
          transition-mode="out-in"
        >
          <template #loading>
            <SidebarFileTreeSkeleton :depth="depth + 1" />
          </template>

          <div class="node-children-list">
            <SidebarFileTreeItem
              v-for="child in normalizedChildren"
              :key="child.path"
              :node="child"
              :depth="depth + 1"
              @node-opened="emit('nodeOpened')"
            />
          </div>
        </AsyncGate>
      </div>
    </div>
  </m.div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { m } from 'motion-v'
import type { FsNode } from '@/types/file-system'
import { useNodeStore } from '@/stores/note'
import { useFileTreeItemExpansion } from '@/composables/useFileTreeItemExpansion'
import { useFileTreeItemRename } from '@/composables/useFileTreeItemRename'
import { useFileTreeDropTarget } from '@/composables/useFileTreeDropTarget'
import { useFileTreeNodeDrag } from '@/composables/useFileTreeNodeDrag'
import { useFileTreeMotion } from '@/composables/useFileTreeMotion'

import FolderOpenIcon from '@/assets/icons/folder-open.svg'
import FolderIcon from '@/assets/icons/folder.svg'
import AsyncGate from '@/components/base/AsyncGate.vue'
import SidebarFileTreeNodeRow from '@/components/sidebar/SidebarFileTreeNodeRow.vue'
import SidebarFileTreeSkeleton from '@/components/sidebar/SidebarFileTreeSkeleton.vue'

const nodeStore = useNodeStore()
const treeMotion = useFileTreeMotion()
const props = defineProps<{ node: FsNode, depth: number }>()
const emit = defineEmits<{
  (event: 'nodeOpened'): void
}>()

const node = computed(() => props.node)
const isDir = computed(() => node.value.type === 'dir')
const isActive = computed(() => nodeStore.currentNode?.path === node.value.path)
const {
  isOpened,
  normalizedChildren,
  childLoadStatus,
  canExpand,
} = useFileTreeItemExpansion(node, isDir)
const currentIcon = computed(() => isOpened.value ? FolderOpenIcon : FolderIcon)
const {
  editName,
  isRenaming,
  isLongPressed,
  setRenameInputRef,
  startLongPress,
  stopLongPress,
  submitRename,
  cancelRename,
} = useFileTreeItemRename(node, nodeStore.renameNode)
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
    await nodeStore.setCurrentNode(node.value)
    if (canExpand.value) {
      await nodeStore.toggleDirectory(node.value)
    }
    return
  }

  await nodeStore.setCurrentNode(node.value)
  emit('nodeOpened')
}

const handleClickDirectoryIcon = async () => {
  if (isRenaming.value) {
    return
  }

  if (isActive.value) {
    nodeStore.clearCurrentNode()
    return
  }

  await nodeStore.setCurrentNode(node.value)
}

const {
  isDirectoryDragOver,
  handleDirectoryDragEnter,
  handleDirectoryDragOver,
  handleDirectoryDragLeave,
  handleDirectoryDrop,
} = useFileTreeDropTarget({
  isDirectory: isDir,
  getDestinationPath: () => node.value.path,
  selectDirectory: () => nodeStore.setCurrentNode(node.value),
  moveNode: nodeStore.moveNode,
})
</script>

<style scoped>
.tree-node-motion {
  width: 100%;
  min-width: 0;
}

.node-children-panel {
  width: 100%;
  min-width: 0;
}

.node-children-state {
  width: 100%;
  min-width: 0;
  min-height: var(--tree-node-row-height);
}

:deep(.tree-node-state-layer) {
  width: 100%;
  min-width: 0;
}

.node-children-list {
  width: 100%;
  min-width: 0;
}

:deep(.tree-node-swap-enter-active) {
  display: grid;
  grid-template-rows: 1fr;
  transition:
    grid-template-rows var(--motion-tree-duration) var(--motion-tree-easing),
    opacity var(--motion-soft-duration) ease;
}

:deep(.tree-node-swap-enter-active > *) {
  min-height: 0;
  overflow: hidden;
}

:deep(.tree-node-swap-leave-active) {
  transition: opacity var(--motion-soft-duration) ease;
}

:deep(.tree-node-swap-enter-from) {
  grid-template-rows: 0fr;
  opacity: 0;
}

:deep(.tree-node-swap-leave-to) {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.tree-node-swap-enter-active),
  :deep(.tree-node-swap-leave-active) {
    transition: none;
  }
}

</style>
