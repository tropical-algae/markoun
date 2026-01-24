<template>
  <div class="tree-node">
    <div 
      class="node-wrapper" 
      :style="{ paddingLeft: depth * 12 + 'px' }"
      @click="handleClickNode"
    >
      <div class="node-content">
        <span class="icon-disclosure">{{ isDir ? (isOpen ? '▾' : '▸') : '' }}</span>
        <span :class="{ 'file-name': !isDir, 'dir-name': isDir }">{{ node.name }}</span>
      </div>
    </div>

    <div v-if="isDir && isOpen" ref="childContainer" class="child-nodes">
      <FsNodeComp 
        v-for="(child, index) in normalizedChildren" 
        :key="index" 
        :node="child" 
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap';
import { ref, computed } from 'vue';
import type { FsNode } from '@/scripts/types';
import { useNodeStore } from '@/scripts/stores/note';

const nodeStore = useNodeStore()

const props = defineProps<{ node: FsNode | string, depth: number }>();
const isOpen = ref(true);
const childContainer = ref(null);

// 标准化数据：处理字符串子节点的情况
const node = computed(() => {
  if (typeof props.node === 'string') {
    return { name: props.node, path: props.node, type: 'file' } as FsNode;
  }
  return props.node;
});

const isDir = computed(() => node.value.type === 'dir');
const normalizedChildren = computed(() => (node.value.children || []));

const handleClickNode = () => {
  nodeStore.setCurrentNode(node.value)

  if (isDir.value) {
    // 文件夹的点击事件
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
  } else {
    // 文件的点击事件

  }
  
  
};
</script>

<style scoped>

</style>