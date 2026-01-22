<template>
  <div class="tree-node">
    <div 
      class="node-wrapper" 
      :style="{ paddingLeft: depth * 12 + 'px' }"
      @click="handleToggle"
    >
      <div class="node-content">
        <span class="icon-disclosure">{{ isDir ? (isOpen ? '▾' : '▸') : '' }}</span>
        <span :class="{ 'file-name': !isDir, 'dir-name': isDir }">{{ node.name }}</span>
      </div>
    </div>

    <div v-if="isDir && isOpen" ref="childContainer" class="child-nodes">
      <FileNodeComp 
        v-for="(child, index) in normalizedChildren" 
        :key="index" 
        :node="child" 
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { FileNode } from '@/scripts/types';
import gsap from 'gsap';

const props = defineProps<{ node: FileNode | string, depth: number }>();
const isOpen = ref(true);
const childContainer = ref(null);

// 标准化数据：处理字符串子节点的情况
const node = computed(() => {
  if (typeof props.node === 'string') {
    return { name: props.node, path: props.node, type: 'file' } as FileNode;
  }
  return props.node;
});

const isDir = computed(() => node.value.type === 'directory');
const normalizedChildren = computed(() => (node.value.children || []));

const handleToggle = () => {
  if (!isDir.value) return;
  
  if (isOpen.value) {
    gsap.to(
      childContainer.value, 
      { 
        height: 0, 
        opacity: 0, 
        duration: 0.2, 
        onComplete: () => { isOpen.value = false }
      }
    );
  } else {
    isOpen.value = true;
    setTimeout(() => {
      gsap.from(childContainer.value, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.out' });
    }, 0);
  }
};
</script>

<style scoped>

</style>