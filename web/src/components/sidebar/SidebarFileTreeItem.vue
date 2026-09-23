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
      @retry="retryDirectory"
    >
      <SidebarFileTreeItem
        v-for="child in normalizedChildren"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        @node-opened="emit('nodeOpened')"
      />
    </SidebarFileTreeBranch>
  </m.div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { m } from 'motion-v'
import type { FsNode } from '@/types/file-system'
import { useNodeStore } from '@/stores/note'
import { useFileTreeItemExpansion } from '@/composables/useFileTreeItemExpansion'
import { useFileTreeItemRename } from '@/composables/useFileTreeItemRename'
import { useFileTreeDropTargetState } from '@/composables/useFileTreeDropController'
import { useFileTreeNodeDrag } from '@/composables/useFileTreeNodeDrag'
import { useFileTreeMotion } from '@/composables/useFileTreeMotion'

import FolderOpenIcon from '@/assets/icons/folder-open.svg'
import FolderIcon from '@/assets/icons/folder.svg'
import SidebarFileTreeBranch from '@/components/sidebar/SidebarFileTreeBranch.vue'
import SidebarFileTreeNodeRow from '@/components/sidebar/SidebarFileTreeNodeRow.vue'

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
      await nodeStore.toggleDirectory(node.value).catch(() => null)
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

</script>

<style scoped>
.tree-node-motion {
  width: 100%;
  min-width: 0;
}

</style>
