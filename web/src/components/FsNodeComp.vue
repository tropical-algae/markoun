<template>
  <div class="tree-node">
    <div 
      class="node-wrapper" 
      :style="{ paddingLeft: depth * 12 + 'px' }"
      @click="handleClickNode"
    >
      <div class="node-content" :class="{ 'is-selected': isActive }">
        <span class="icon-disclosure">{{ isDir ? (isOpen ? '▾' : '▸') : '' }}</span>
        
        <div class="node-text-wrapper">
          <span :class="{ 'file-name': !isDir, 'dir-name': isDir }">{{ node.name }}</span>
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
      <div v-if="isDir && isOpen" class="child-nodes overflow-hidden">
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
import { ref, computed } from 'vue';
import type { FsNode } from '@/scripts/types';
import { useNodeStore } from '@/scripts/stores/note';

const nodeStore = useNodeStore()
const props = defineProps<{ node: FsNode | string, depth: number }>();

const isOpen = ref(false);
const node = computed(() => {
  if (typeof props.node === 'string') {
    return { name: props.node, path: props.node, type: 'file' } as FsNode;
  }
  return props.node;
});
const isActive = computed(() => nodeStore.currentNode?.path === node.value.path);
const isDir = computed(() => node.value.type === 'dir');
const normalizedChildren = computed(() => (node.value.children || []));

const handleClickNode = () => {
  nodeStore.setCurrentNode(node.value);
  if (isDir.value) {
    isOpen.value = !isOpen.value;
  }
};

const onEnter = (el: Element, done: () => void) => {
  gsap.set(el, { height: 0 });
  
  gsap.to(el, {
    height: (el as HTMLElement).scrollHeight,
    duration: 0.3,
    ease: 'power3.out',
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
    duration: 0.3,
    ease: 'power3.inOut',
    onComplete: done
  });
};
</script>
