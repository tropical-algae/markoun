<template>
  <div>
    <div 
      class="node-wrapper" 
      :style="{ paddingLeft: depth * 12 + 'px' }"
      @click="handleClickNode"
    >
      <div class="node-content" :class="{ 'is-selected': isActive }">
        <component v-if="isDir" :is="currentIcon" class="node-icon"></component>
        
        <div class="node-text-wrapper">
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
        
        <span v-if="node.suffix" class="node-tag">{{ node.suffix.toUpperCase() }}</span>
      </div>
    </div>

    <Transition
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
      :css="false"
    >
      <div v-if="isDir && isOpened" class="overflow-hidden">
        <FsNodeComp 
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
import type { FsNode } from '@/scripts/types';
import { useNodeStore } from '@/scripts/stores/note';

import FolderOpenIcon from "@/assets/icons/folder-open.svg"
import FolderIcon from "@/assets/icons/folder.svg"


const nodeStore = useNodeStore()
const props = defineProps<{ node: FsNode | string, depth: number }>();

const node = computed(() => {
  if (typeof props.node === 'string') {
    return { name: props.node, path: props.node, type: 'file' } as FsNode;
  }
  return props.node;
});

const editName = ref('');
const isOpened = ref(false);
const isRenaming = ref(false);
const isDir = computed(() => node.value.type === 'dir');
const isActive = computed(() => nodeStore.currentNode?.path === node.value.path);
const normalizedChildren = computed(() => (node.value.children || []));
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
  console.log("===========================")
  await nodeStore.renameNode(node.value.path, editName.value)
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
  if (isDir.value) {
    isOpened.value = !isOpened.value;
  }
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
