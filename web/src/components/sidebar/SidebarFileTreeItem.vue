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
          <Transition name="soft-swap" mode="out-in">
            <div
              v-if="isLoading"
              key="loading"
              class="node-placeholder"
              :style="{ paddingLeft: (depth + 1) * 12 + 'px' }"
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
            <div v-else key="children" class="node-children-list">
              <SidebarFileTreeItem 
                v-for="(child, _index) in normalizedChildren" 
                :key="child.path" 
                :node="child" 
                :depth="depth + 1"
              />
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { FsNode } from '@/types/file-system';
import { useNodeStore } from '@/stores/note';

import FolderOpenIcon from "@/assets/icons/folder-open.svg"
import FolderIcon from "@/assets/icons/folder.svg"
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';


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
const childrenPanelRef = ref<HTMLElement | null>(null);
const childrenContentRef = ref<HTMLElement | null>(null);
let pressTimer: number | null = null;
let panelResizeObserver: ResizeObserver | null = null;
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

const handleClickNode = async () => {
  if (isLongPressed.value) {
    isLongPressed.value = false;
    return;
  }
  if (isRenaming.value) return;

  if (isDir.value) {
    nodeStore.setCurrentNode(node.value);
    if (canExpand.value) {
      await nodeStore.toggleDirectory(node.value);
    }
    return;
  }

  nodeStore.setCurrentNode(node.value);
};

const handleClickDirectoryIcon = () => {
  if (isRenaming.value) {
    return;
  }

  if (isActive.value) {
    nodeStore.clearCurrentNode();
    console.log(nodeStore.currentNode);
    return;
  }

  nodeStore.setCurrentNode(node.value);
};

const disconnectPanelResizeObserver = () => {
  panelResizeObserver?.disconnect();
  panelResizeObserver = null;
};

const animatePanelHeightToContent = () => {
  const panel = childrenPanelRef.value;
  const content = childrenContentRef.value;
  if (!panel || !content) {
    return;
  }

  const nextHeight = content.scrollHeight;
  const currentHeight = panel.offsetHeight;
  if (Math.abs(currentHeight - nextHeight) < 1) {
    panel.style.height = `${nextHeight}px`;
    return;
  }

  gsap.killTweensOf(panel);
  gsap.set(panel, { height: currentHeight });
  gsap.to(panel, {
    height: nextHeight,
    duration: 0.4,
    ease: 'power2.out',
    overwrite: 'auto',
  });
};

const connectPanelResizeObserver = () => {
  disconnectPanelResizeObserver();
  if (!childrenContentRef.value) {
    return;
  }

  panelResizeObserver = new ResizeObserver(() => {
    if (!isOpened.value) {
      return;
    }
    animatePanelHeightToContent();
  });
  panelResizeObserver.observe(childrenContentRef.value);
};

watch(
  isOpened,
  async (opened) => {
    disconnectPanelResizeObserver();
    if (!opened) {
      return;
    }

    await nextTick();
    connectPanelResizeObserver();
  },
  { flush: 'post' }
);

onBeforeUnmount(() => {
  disconnectPanelResizeObserver();
});

const onEnter = (el: Element, done: () => void) => {
  const panel = el as HTMLElement;
  const content = panel.firstElementChild as HTMLElement | null;
  const nextHeight = content?.scrollHeight ?? panel.scrollHeight;

  gsap.killTweensOf(panel);
  gsap.set(panel, { height: 0 });
  
  gsap.to(panel, {
    height: nextHeight,
    duration: 0.4,
    ease: 'power2.out',
    overwrite: 'auto',
    onComplete: () => {
      panel.style.height = `${content?.scrollHeight ?? nextHeight}px`;
      done();
    }
  });
};

const onLeave = (el: Element, done: () => void) => {
  const panel = el as HTMLElement;
  disconnectPanelResizeObserver();

  gsap.killTweensOf(panel);
  gsap.set(panel, { height: panel.offsetHeight });
  
  gsap.to(panel, {
    height: 0,
    duration: 0.4,
    ease: 'power2.inOut',
    overwrite: 'auto',
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

  transition: background-color var(--motion-soft-duration) var(--motion-soft-ease);
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
  pointer-events: none;
}

.node-placeholder {
  padding-top: 2px;
  padding-bottom: 2px;
}

.node-placeholder-content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
}

.node-placeholder-text {
  max-width: 260px;
}

.node-children-content {
  width: 100%;
}
</style>
