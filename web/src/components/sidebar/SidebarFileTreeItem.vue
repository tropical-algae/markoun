<template>
  <div>
    <div
      class="node-wrapper"
      :style="nodeIndentStyle"
    >
      <div
        class="node-content"
        :class="{ 'is-selected': isActive, 'is-dragover': isDirectoryDragOver }"
        @click="handleClickNode"
        @dragenter.prevent="handleDirectoryDragEnter"
        @dragover.prevent="handleDirectoryDragOver"
        @dragleave.prevent="handleDirectoryDragLeave"
        @drop.prevent="handleDirectoryDrop"
      >
        <button
          v-if="isDir"
          class="node-toggle-btn"
          :class="{ 'is-opened': isOpened, 'is-disabled': !canExpand }"
          @click.stop="handleClickDirectoryIcon"
        >
          <!-- <span class="disclosure-caret" :class="{ 'is-hidden': !canExpand }"></span> -->
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
              ref="renameInputRef"
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
          <AsyncGate :status="childLoadStatus">
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
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import type { FsNode } from '@/types/file-system';
import { useNodeStore } from '@/stores/note';
import type { AsyncStatus } from '@/types/async';
import { useHeightMotion } from '@/composables/useHeightMotion';
import { TREE_LONG_PRESS_DELAY_MS } from '@/constants/ui';

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

const editName = ref('');
const isRenaming = ref(false);
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

const renameInputRef = ref<HTMLInputElement | null>(null);
const childrenPanelRef = ref<HTMLElement | null>(null);
const childrenContentRef = ref<HTMLElement | null>(null);
let pressTimer: number | null = null;
const isLongPressed = ref(false);
const isDirectoryDragOver = ref(false);
let dragDepth = 0;
const childrenMotion = useHeightMotion(childrenPanelRef, childrenContentRef)

const onLongPress = () => {
  isLongPressed.value = false;
  pressTimer = window.setTimeout(() => {
    isLongPressed.value = true;
    enterRenameMode();
  }, TREE_LONG_PRESS_DELAY_MS);
};

const cancelLongPress = () => {
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
};

const enterRenameMode = async () => {
  editName.value = node.value.name;
  isRenaming.value = true;
  
  await nextTick();
  if (renameInputRef.value) {
    renameInputRef.value.focus();
    renameInputRef.value.select();
  }
};

const submitRename = async () => {
  if (!editName.value.trim() || editName.value === node.value.name) {
    cancelRename();
    return;
  }
  await nodeStore.renameNode(node.value, editName.value)
  isRenaming.value = false;
};

const cancelRename = () => {
  isRenaming.value = false;
};

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

const resetDirectoryDragState = () => {
  dragDepth = 0;
  isDirectoryDragOver.value = false;
};

const hasDraggedFiles = (event: DragEvent): boolean => {
  const types = event.dataTransfer?.types;
  return Boolean(types && Array.from(types).includes('Files'));
};

const handleDirectoryDragEnter = (event: DragEvent) => {
  if (!isDir.value || !hasDraggedFiles(event)) {
    return;
  }

  dragDepth += 1;
  isDirectoryDragOver.value = true;
};

const handleDirectoryDragOver = (event: DragEvent) => {
  if (!isDir.value || !hasDraggedFiles(event)) {
    return;
  }

  event.dataTransfer!.dropEffect = 'copy';
  isDirectoryDragOver.value = true;
};

const handleDirectoryDragLeave = (event: DragEvent) => {
  if (!isDir.value || !hasDraggedFiles(event)) {
    return;
  }

  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) {
    isDirectoryDragOver.value = false;
  }
};

const handleDirectoryDrop = async (event: DragEvent) => {
  if (!isDir.value || !hasDraggedFiles(event) || nodeStore.isUploadPending()) {
    resetDirectoryDragState();
    return;
  }

  const file = event.dataTransfer?.files?.[0];
  resetDirectoryDragState();

  if (!file) {
    return;
  }

  const uploadPercent = ref(0);
  await nodeStore.setCurrentNode(node.value);
  await nodeStore.uploadFile(file, uploadPercent, node.value.path);
};

onBeforeUnmount(() => {
  cancelLongPress();
});

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
  --node-text-line-height: 1rem;
  --node-text-padding-y: 2px;
  --node-text-padding-x: 3px;
  --node-text-height: calc(var(--node-text-line-height) + var(--node-text-padding-y) * 2);
  font-size: 0.8rem;
  color: var(--color-text-pri);
  width: 100%; 
  box-sizing: border-box;
  padding-left: calc(var(--tree-depth) * var(--tree-indent-step));
}

.node-content {
  padding: var(--tree-row-padding);
  cursor: pointer;
  border-radius: var(--tree-row-radius);
  display: flex;
  align-items: center;
  gap: var(--hint-gap);
  width: 100%;

  transition: background-color var(--motion-soft-duration) var(--motion-soft-ease);
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
  padding: 1px 0;
  min-height: var(--node-text-height);
}

.dir-icon {
  transition: fill var(--motion-soft-duration) var(--motion-soft-ease);
}

.node-toggle-btn,
.node-leading-spacer {
  /* width: 2rem; */
  /* min-width: 2rem; */
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

.disclosure-caret {
  width: 0;
  height: 0;
  border-top: var(--tree-caret-height) solid transparent;
  border-bottom: var(--tree-caret-height) solid transparent;
  border-left: var(--tree-caret-width) solid var(--color-text-sec);
  transition: transform var(--motion-soft-duration) var(--motion-soft-ease);
}

.disclosure-caret.is-hidden {
  visibility: hidden;
}

.node-toggle-btn.is-opened .disclosure-caret {
  transform: rotate(90deg);
}

.node-text-wrapper .file-name, 
.node-text-wrapper .dir-name {
  padding: var(--node-text-padding-y) var(--node-text-padding-x);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%; 
  min-height: var(--node-text-height);
  display: flex;
  align-items: center;
  box-sizing: border-box;
  line-height: var(--node-text-line-height);
}

.node-text-wrapper .file-name { 
  color: var(--color-text-sec);
  transition: color var(--motion-soft-duration) var(--motion-soft-ease);
}

.node-content.is-selected .node-text-wrapper span,
.node-content:hover .node-text-wrapper span {
  color: var(--color-text-pri);
}

.node-content.is-selected .dir-icon,
.node-content:hover .dir-icon {
  fill: var(--color-action);
}

.node-content.is-selected,
.node-content:hover {
  background-color: var(--color-bg-selected);
}

.node-content.is-dragover {
  background-color: var(--color-action-light);
  /* border: 1.5px dashed var(--color-action); */
  box-shadow: inset 0 0 0 1px var(--color-action);
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
  min-height: var(--node-text-height);
  border: none;
  outline: none;
  padding: 0 var(--node-text-padding-x);
  margin: 0;
  border-radius: var(--tree-row-radius);
  color: var(--color-text-pri);
  font-family: inherit;
  box-sizing: border-box;
  line-height: var(--node-text-line-height);
}

.node-icon {
  width: var(--tree-icon-size);
  height: var(--tree-icon-size);
  flex-shrink: 0;
  pointer-events: none;
}

.node-placeholder {
  padding-top: 2px;
  padding-bottom: 2px;
  padding-left: calc(var(--tree-depth) * var(--tree-indent-step));
}

.node-placeholder-content {
  display: flex;
  align-items: center;
  gap: var(--hint-gap);
  padding: var(--tree-row-padding);
}

.node-placeholder-text {
  max-width: var(--tree-rename-max-width);
}

.node-children-content {
  width: 100%;
}
</style>
