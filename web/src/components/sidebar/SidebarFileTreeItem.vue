<template>
  <div>
    <div
      class="node-wrapper"
      :style="nodeIndentStyle"
    >
      <div
        class="node-content"
        :class="{
          'is-selected': isActive,
          'is-dragover': isDirectoryDragOver,
          'is-node-dragging': isNodeDragging,
        }"
        :draggable="!isRenaming"
        @click="handleClickNode"
        @dragstart.stop="handleDragStart"
        @dragend="handleNodeDragEnd"
        @dragenter.prevent.stop="handleDirectoryDragEnter"
        @dragover.prevent.stop="handleDirectoryDragOver"
        @dragleave.prevent.stop="handleDirectoryDragLeave"
        @drop.prevent.stop="handleDirectoryDrop"
      >
        <button
          v-if="isDir"
          class="node-toggle-btn"
          :class="{ 'is-opened': isOpened, 'is-disabled': !canExpand }"
          @click.stop="handleClickDirectoryIcon"
        >
          <component
            :is="currentIcon"
            class="node-icon dir-icon"
          ></component>
        </button>
        <span v-else class="node-leading-spacer"></span>
        
        <div class="node-text-wrapper">
          <div class="node-text-slot">
            <input
              v-if="isRenaming"
              :ref="setRenameInputRef"
              v-model="editName"
              class="rename-input"
              @click.stop 
              @blur="submitRename" 
              @keydown.enter="($event.target as HTMLInputElement).blur()" 
              @keydown.esc="cancelRename"
            />

            <span 
              v-else
              :class="{ 'file-name': !isDir, 'dir-name': isDir }"
              @mousedown="onLongPress"
              @touchstart="onLongPress"
              @mouseup="cancelLongPress"
              @mouseleave="cancelLongPress"
              @touchend="cancelLongPress"
            >
              {{ node.name }}
            </span>
          </div>
        </div>
        
        <span v-if="node.suffix" class="meta-tag">{{ node.suffix.toUpperCase() }}</span>
      </div>
    </div>

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
              <div
                class="node-placeholder"
                :style="placeholderIndentStyle"
              >
                <div class="node-placeholder-content">
                  <span class="node-leading-spacer"></span>
                  <BaseSkeleton width="1rem" height="1rem" radius="4px" />
                  <BaseSkeleton
                    class="node-placeholder-text"
                    height="1rem"
                    width="58%"
                    radius="6px"
                  />
                </div>
              </div>
            </template>

            <div class="node-children-list">
              <SidebarFileTreeItem 
                v-for="(child, _index) in normalizedChildren" 
                :key="child.path" 
                :node="child" 
                :depth="depth + 1"
              />
            </div>
          </AsyncGate>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FsNode } from '@/types/file-system';
import { useNodeStore } from '@/stores/note';
import type { AsyncStatus } from '@/types/async';
import { useHeightMotion } from '@/composables/useHeightMotion';
import { useFileTreeItemRename } from '@/composables/useFileTreeItemRename';
import { useFileTreeDropTarget } from '@/composables/useFileTreeDropTarget';
import { useFileTreeNodeDrag } from '@/composables/useFileTreeNodeDrag';

import FolderOpenIcon from "@/assets/icons/folder-open.svg"
import FolderIcon from "@/assets/icons/folder.svg"
import AsyncGate from '@/components/base/AsyncGate.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';


const nodeStore = useNodeStore()
const props = defineProps<{ node: FsNode, depth: number }>();

const node = computed(() => props.node);
const nodeIndentStyle = computed(() => ({
  '--tree-depth': props.depth,
}));
const placeholderIndentStyle = computed(() => ({
  '--tree-depth': props.depth + 1,
}));

const isDir = computed(() => node.value.type === 'dir');
const isActive = computed(() => nodeStore.currentNode?.path === node.value.path);
const isOpened = computed(() => isDir.value && nodeStore.isDirectoryExpanded(node.value.path));
const normalizedChildren = computed(() => nodeStore.getDirectoryChildren(node.value.path));
const childLoadStatus = computed<AsyncStatus>(() => {
  const state = nodeStore.getDirectoryLoadState(node.value.path)
  if (state === 'loaded') {
    return 'ready'
  }
  return state
});
const canExpand = computed(() => {
  return isDir.value && (node.value.has_children !== false || normalizedChildren.value.length > 0);
});
const currentIcon = computed(() => isOpened.value ? FolderOpenIcon : FolderIcon)

const childrenPanelRef = ref<HTMLElement | null>(null);
const childrenContentRef = ref<HTMLElement | null>(null);
const childrenMotion = useHeightMotion(childrenPanelRef, childrenContentRef)
const {
  editName,
  isRenaming,
  isLongPressed,
  setRenameInputRef,
  onLongPress,
  cancelLongPress,
  submitRename,
  cancelRename,
} = useFileTreeItemRename(node, nodeStore.renameNode)
const {
  isNodeDragging,
  handleNodeDragStart,
  handleNodeDragEnd,
} = useFileTreeNodeDrag(node, () => !isRenaming.value)

const handleDragStart = (event: DragEvent) => {
  cancelLongPress()
  handleNodeDragStart(event)
}

const handleClickNode = async () => {
  if (isLongPressed.value) {
    isLongPressed.value = false;
    return;
  }
  if (isRenaming.value) return;

  if (isDir.value) {
    await nodeStore.setCurrentNode(node.value);
    if (canExpand.value) {
      await nodeStore.toggleDirectory(node.value);
    }
    return;
  }

  await nodeStore.setCurrentNode(node.value);
};

const handleClickDirectoryIcon = async () => {
  if (isRenaming.value) {
    return;
  }

  if (isActive.value) {
    nodeStore.clearCurrentNode();
    return;
  }

  await nodeStore.setCurrentNode(node.value);
};

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

const onEnter = (element: Element, done: () => void) => {
  childrenMotion.enter(element, () => {
    childrenMotion.connectResizeObserver(() => isOpened.value);
    done();
  });
};
const onLeave = childrenMotion.leave;
</script>


<style scoped>

.node-wrapper {
  font-size: 0.8rem;
  color: var(--color-text-pri);
  width: 100%; 
  box-sizing: border-box;
  padding-left: calc(var(--tree-depth) * var(--tree-indent-step));
}

.node-content {
  position: relative;
  padding: var(--tree-row-padding);
  cursor: pointer;
  border-radius: var(--tree-row-radius);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--hint-gap);
  width: 100%;
  min-width: 0;
  background-color: transparent;
  isolation: isolate;
}

.node-content::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background-color: var(--color-bg-selected);
  content: "";
  opacity: 0;
  pointer-events: none;
  transition:
    opacity var(--motion-soft-duration) ease,
    background-color var(--motion-soft-duration) ease;
}

.node-content > .meta-tag {
  flex-shrink: 0;
}

.node-text-wrapper {
  flex: 1;
  min-width: 0; 
  display: flex; 
  align-items: stretch;
}

.node-text-slot {
  width: 100%;
  min-width: 0;
  padding: var(--tree-node-text-slot-padding-y) 0;
  min-height: var(--tree-node-text-height);
}

.dir-icon {
  transition: fill var(--motion-soft-duration) ease;
}

.node-toggle-btn,
.node-leading-spacer {
  height: var(--tree-icon-size);
  flex-shrink: 0;
}

.node-toggle-btn {
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.node-toggle-btn.is-disabled {
  cursor: default;
}

.node-text-wrapper .file-name, 
.node-text-wrapper .dir-name {
  padding: var(--tree-node-text-padding-y) var(--tree-node-text-padding-x);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%; 
  max-width: 100%;
  min-height: var(--tree-node-text-height);
  display: block;
  box-sizing: border-box;
  line-height: var(--tree-node-text-line-height);
}

.node-text-wrapper .file-name { 
  color: var(--color-text-sec);
  transition: color var(--motion-soft-duration) ease;
}

.node-content.is-selected .node-text-wrapper span,
.node-content:hover .node-text-wrapper span {
  color: var(--color-text-pri);
}

.dir-icon {
  fill: var(--color-text-pri);
}

.node-content.is-selected .dir-icon,
.node-content:hover .dir-icon {
  fill: var(--color-action);
}

.node-content.is-selected::before,
.node-content:hover::before {
  opacity: 1;
}

.node-content.is-dragover {
  box-shadow: inset 0 0 0 1px var(--color-action);
}

.node-content.is-dragover::before {
  background-color: var(--color-action-light);
  opacity: 1;
}

.node-content.is-node-dragging {
  opacity: 0.45;
}

.node-content.is-dragover .node-text-wrapper span {
  color: var(--color-text-pri);
}

.node-content.is-dragover .dir-icon {
  fill: var(--color-action);
}

.rename-input {
  background-color: var(--color-bg-pri);
  width: 100%;
  min-height: var(--tree-node-text-height);
  border: none;
  outline: none;
  padding: 0 var(--tree-node-text-padding-x);
  margin: 0;
  border-radius: var(--tree-row-radius);
  color: var(--color-text-pri);
  font-family: inherit;
  box-sizing: border-box;
  line-height: var(--tree-node-text-line-height);
}

.node-icon {
  width: var(--tree-icon-size);
  height: var(--tree-icon-size);
  flex-shrink: 0;
  pointer-events: none;
}

.node-placeholder {
  padding-left: calc(var(--tree-depth) * var(--tree-indent-step));
}

.node-placeholder-content {
  display: flex;
  align-items: center;
  gap: var(--hint-gap);
  padding: var(--tree-row-padding);
  min-height: var(--tree-node-row-height);
  box-sizing: border-box;
}

.node-placeholder-text {
  max-width: var(--tree-rename-max-width);
}

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
