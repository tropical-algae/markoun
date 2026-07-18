<template>
  <div>
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

    <Transition
      @enter="onEnter"
      @leave="onLeave"
      :css="false"
    >
      <div
        v-if="isDir && isOpened"
        ref="childrenPanelRef"
        class="node-children-panel overflow-hidden"
      >
        <div ref="childrenContentRef" class="node-children-content">
          <AsyncGate
            :status="childLoadStatus"
            transition-name="tree-node-swap"
          >
            <template #loading>
              <SidebarFileTreeSkeleton :depth="depth + 1" />
            </template>

            <div class="node-children-list">
              <SidebarFileTreeItem
                v-for="(child, _index) in normalizedChildren"
                :key="child.path"
                :node="child"
                :depth="depth + 1"
                @node-opened="emit('nodeOpened')"
              />
            </div>
          </AsyncGate>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FsNode } from '@/types/file-system'
import { useNodeStore } from '@/stores/note'
import { useFileTreeItemExpansion } from '@/composables/useFileTreeItemExpansion'
import { useFileTreeItemRename } from '@/composables/useFileTreeItemRename'
import { useFileTreeDropTarget } from '@/composables/useFileTreeDropTarget'
import { useFileTreeNodeDrag } from '@/composables/useFileTreeNodeDrag'

import FolderOpenIcon from '@/assets/icons/folder-open.svg'
import FolderIcon from '@/assets/icons/folder.svg'
import AsyncGate from '@/components/base/AsyncGate.vue'
import SidebarFileTreeNodeRow from '@/components/sidebar/SidebarFileTreeNodeRow.vue'
import SidebarFileTreeSkeleton from '@/components/sidebar/SidebarFileTreeSkeleton.vue'

const nodeStore = useNodeStore()
const props = defineProps<{ node: FsNode, depth: number }>()
const emit = defineEmits<{
  (event: 'nodeOpened'): void
}>()

const node = computed(() => props.node)
const isDir = computed(() => node.value.type === 'dir')
const isActive = computed(() => nodeStore.currentNode?.path === node.value.path)
const childrenPanelRef = ref<HTMLElement | null>(null)
const childrenContentRef = ref<HTMLElement | null>(null)
const {
  isOpened,
  normalizedChildren,
  childLoadStatus,
  canExpand,
  onEnter,
  onLeave,
} = useFileTreeItemExpansion(node, isDir, childrenPanelRef, childrenContentRef)
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
.node-children-content {
  width: 100%;
}

:deep(.tree-node-swap-enter-active),
:deep(.tree-node-swap-leave-active) {
  transition: opacity var(--motion-soft-duration) ease;
}

:deep(.tree-node-swap-enter-from),
:deep(.tree-node-swap-leave-to) {
  opacity: 0;
}

</style>
