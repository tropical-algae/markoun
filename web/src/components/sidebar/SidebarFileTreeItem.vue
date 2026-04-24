<template>
  <div>
    <div
      class="node-wrapper"
      :style="{ paddingLeft: depth * 12 + 'px' }"
    >
      <div class="node-content" :class="{ 'is-selected': isActive }" @click="handleClickNode">
        <button
          v-if="isDir"
          class="node-toggle-btn"
          :class="{ 'is-opened': isOpened, 'is-disabled': !canExpand }"
          @click.stop="handleToggleDirectory"
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
      @after-enter="onAfterEnter"
      @leave="onLeave"
      :css="false"
    >
      <div v-if="isDir && isOpened" class="overflow-hidden">
        <div
          v-if="isLoading"
          class="node-placeholder"
          :style="{ paddingLeft: (depth + 1) * 12 + 'px' }"
        >
          Loading...
        </div>
        <SidebarFileTreeItem 
          v-for="(child, _index) in normalizedChildren" 
          :key="child.path" 
          :node="child" 
          :depth="depth + 1"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap';
import { ref, computed, nextTick } from 'vue';
import type { FsNode } from '@/types/file-system';
import { useNodeStore } from '@/stores/note';

import FolderOpenIcon from "@/assets/icons/folder-open.svg"
import FolderIcon from "@/assets/icons/folder.svg"


const nodeStore = useNodeStore()
const props = defineProps<{ node: FsNode, depth: number }>();

const node = computed(() => props.node);

const editName = ref('');
const isRenaming = ref(false);
const isDir = computed(() => node.value.type === 'dir');
const isActive = computed(() => nodeStore.currentNode?.path === node.value.path);
const isOpened = computed(() => isDir.value && nodeStore.isDirectoryExpanded(node.value.path));
const isLoading = computed(() => isDir.value && nodeStore.getDirectoryLoadState(node.value.path) === 'loading');
const normalizedChildren = computed(() => nodeStore.getDirectoryChildren(node.value.path));
const canExpand = computed(() => {
  return isDir.value && (node.value.has_children !== false || normalizedChildren.value.length > 0);
});
const currentIcon = computed(() => isOpened.value ? FolderOpenIcon : FolderIcon)

const renameInputRef = ref<HTMLInputElement | null>(null);
let pressTimer: number | null = null;
const isLongPressed = ref(false);

const onLongPress = () => {
  isLongPressed.value = false;
  pressTimer = window.setTimeout(() => {
    isLongPressed.value = true;
    enterRenameMode();
  }, 600);
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

const handleClickNode = () => {
  if (isLongPressed.value) {
    isLongPressed.value = false;
    return;
  }
  if (isRenaming.value) return;

  nodeStore.setCurrentNode(node.value);
};

const handleToggleDirectory = async () => {
  if (!canExpand.value) {
    return;
  }

  await nodeStore.toggleDirectory(node.value);
};

const onEnter = (el: Element, done: () => void) => {
  gsap.set(el, { height: 0 });
  
  gsap.to(el, {
    height: (el as HTMLElement).scrollHeight,
    duration: 0.4,
    ease: 'power2.out',
    onComplete: done
  });
};

const onAfterEnter = (el: Element) => {
  (el as HTMLElement).style.height = ''; 
};

const onLeave = (el: Element, done: () => void) => {
  gsap.set(el, { height: (el as HTMLElement).offsetHeight });
  
  gsap.to(el, {
    height: 0,
    duration: 0.4,
    ease: 'power2.inOut',
    onComplete: done
  });
};
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
}

.node-content {
  padding: 2px 6px;
  cursor: pointer;
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;

  transition: background-color 0.3s ease;
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
  transition: fill 0.2s ease;
}

.dir-icon:hover {
  fill: var(--color-action);
}

.node-toggle-btn,
.node-leading-spacer {
  /* width: 2rem; */
  /* min-width: 2rem; */
  height: 1rem;
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
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 5px solid var(--color-text-sec);
  transition: transform 0.2s ease;
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
  transition: color 0.3s ease;
}

.node-content.is-selected .node-text-wrapper span,
.node-content:hover .node-text-wrapper span {
  color: var(--color-text-pri);
}

.node-content.is-selected,
.node-content:hover {
  background-color: var(--color-bg-selected);
}

.rename-input {
  background-color: var(--color-bg-pri);
  width: 100%;
  min-height: var(--node-text-height);
  border: none;
  outline: none;
  padding: 0 var(--node-text-padding-x);
  margin: 0;
  border-radius: 5px;
  color: var(--color-text-pri);
  font-family: inherit;
  box-sizing: border-box;
  line-height: var(--node-text-line-height);
}

.node-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.node-placeholder {
  color: var(--color-text-sec);
  font-size: 0.78rem;
  padding-top: 2px;
  padding-bottom: 2px;
}
</style>
