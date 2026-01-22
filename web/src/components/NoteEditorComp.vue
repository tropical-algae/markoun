
<script setup lang="ts">
import { ref, computed } from 'vue';

import PreviewIcon from "@/assets/icons/overview.svg"
import MetaIcon from "@/assets/icons/info.svg"
import SidebarToggleIcon from "@/assets/icons/sidebar.svg"


import { marked } from 'marked';
import gsap from 'gsap';

const showInspector = ref(false);
const inspectorWidth = ref(0);
const lastWidth = ref(300);
const isResizing = ref(false);

const noteTitle = ref("README.md")
const markdown = ref('# Hello Felix\nStart editing your notes here...');
const renderedContent = computed(() => marked.parse(markdown.value));

const inspectMode = ref<'meta' | 'preview'>('meta');
const inspectIcons = [
  { icon: MetaIcon, mode: 'meta' },
  { icon: PreviewIcon, mode: 'preview' }
] as const
const sidebarIcons = [
  { icon: SidebarToggleIcon }
] as const


const toggleInspector = (newMode: 'meta' | 'preview') => {
  if (showInspector.value && inspectMode.value === newMode) {
    gsap.to(inspectorWidth, {
      value: 0,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        showInspector.value = false;
      }
    });
  } else {
    inspectMode.value = newMode;
    if (!showInspector.value) {
      showInspector.value = true;
      gsap.to(inspectorWidth, {
        value: lastWidth.value,
        duration: 0.4,
        ease: 'power2.inOut'
      });
    }
  }
};


const startResizing = (_: MouseEvent) => {
  isResizing.value = true;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopResizing);
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return;
  // 计算宽度：窗口宽度 - 鼠标当前位置
  const newWidth = window.innerWidth - e.clientX;
  if (newWidth > 150 && newWidth < 600) {
    inspectorWidth.value = newWidth;
    lastWidth.value = newWidth;
  }
};

const stopResizing = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResizing);
};

</script>

<template>
  <div class="editor-wrapper" :class="{ 'is-resizing': isResizing }">
    <header class="editor-header">
      <div class="floating-left">
        <button 
          v-for="(item, _) in sidebarIcons" 
        >
          <component :is="item.icon" class="icon-btn"></component>
        </button>
      </div>
      <span class="text-muted">{{ noteTitle }}</span>
      <div class="floating-right">
        <button 
          v-for="(item, _) in inspectIcons" 
          :class="{ active: showInspector && inspectMode === item.mode }"
          @click="toggleInspector(item.mode)"
        >
          <component :is="item.icon" class="icon-btn"></component>
        </button>
      </div>
    </header>
    
    <div class="editor-container">
      <textarea 
        v-model="markdown" 
        class="markdown-editor"
        placeholder="Start typing..."
        spellcheck="false"
      ></textarea>
    </div>
  </div>

  <aside 
    class="inspector-wrapper" 
    v-if="showInspector"
    ref="inspectorRef"
    :style="{ 
      width: inspectorWidth +  'px', 
      opacity: inspectorWidth > 1 ? 1 : 0 
    }"
    :class="{ 'is-resizing': isResizing }"
  >
    <div 
      class="vertical-line turn-left" 
      @mousedown="startResizing"
      :class="{ 'is-resizing': isResizing }"
    ></div>
    <div 
      class="inspector-container" 
      :style="{ width: lastWidth + 'px' }"
    >
      <transition name="fade" mode="out-in">
        <div v-if="inspectMode === 'meta'" class="d-flex flex-column h-100 overflow-hidden p-0 small text-muted">
          <div class="inspector-title uppercase">Metadata</div>
          <div class="note-meta"><span>Characters:</span> <span>{{ markdown.length }}</span></div>
        </div>

        <div v-else class="d-flex flex-column h-100 overflow-hidden p-0">
          <div class="inspector-title small text-muted uppercase">Preview</div>
          <div class="note-preview" v-html="renderedContent"></div>
        </div>
      </transition>
    </div>
  </aside>

</template>