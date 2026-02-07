<template>
  <div class="editor-wrapper" :class="{ 'is-resizing': isResizing }">
    <header class="container-fluid">
      <div class="row align-items-center flex-nowrap g-0 container-header">

        <div class="col-auto d-flex justify-content-start flex-shrink-0 gap-2 ps-3">
          <button v-for="item in sidebarIcons">
            <component :is="item.icon" class="icon-btn"></component>
          </button>
        </div>

        <div class="col px-3" style="min-width: 0;">
          <span class="d-block text-truncate text-muted text-center">
            {{ nodeStore.currentFile.name }}
          </span>
        </div>

        <div class="col-auto d-flex justify-content-end flex-shrink-0 gap-2 pe-3">
          <button 
            v-for="item in inspectIcons" 
            :class="{ active: showInspector && inspectMode === item.mode }"
            @click="item.func()"
          >
            <component :is="item.icon" class="icon-btn"></component>
          </button>
        </div>

      </div>
    </header>
    
    <div class="editor-container">
      <textarea 
        v-model="nodeStore.currentFile.content" 
        ref="markdownEditorRef"
        class="markdown-editor"
        placeholder="Start typing..."
        spellcheck="false"
        @paste="handlePaste" 
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
      class="vertical-line turn-left col-drag" 
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

          <div class="note-meta">
            <div class="meta-grid">
              <div class="meta-key">characters:</div>
              <div class="meta-value">{{ nodeStore.currentFile.content.length }}</div>
              <template
                v-for="(value, key) in nodeStore.currentFile.meta"
                :key="key"
              >
                <div class="meta-key">{{ key }}:</div>
                <div class="meta-value">{{ value }}</div>
              </template> 
            </div>
          </div>
        </div>

        <div v-else class="d-flex flex-column h-100 overflow-hidden p-0">
          <div class="inspector-title small text-muted uppercase">Preview</div>
          <div class="note-preview" v-html="nodeStore.currrentRenderedFile"></div>
        </div>
      </transition>
    </div>
  </aside>

</template>

<script setup lang="ts">
import gsap from 'gsap';
import { ref, nextTick } from 'vue';

import PreviewIcon from "@/assets/icons/overview.svg"
import MetaIcon from "@/assets/icons/info.svg"
import SidebarToggleIcon from "@/assets/icons/sidebar.svg"
import SaveIcon from "@/assets/icons/disk.svg"

import { useNodeStore } from '@/scripts/stores/note';
import { insertTimeToFileName } from '@/scripts/utils/util';


const nodeStore = useNodeStore()

const showInspector = ref(false);
const inspectorWidth = ref(0);
const lastWidth = ref(300);
const isResizing = ref(false);
const uploadPercent = ref(0)


const markdownEditorRef = ref<HTMLTextAreaElement | null>(null);

const inspectMode = ref<'meta' | 'preview'>('meta');
const inspectIcons = [
  { icon: SaveIcon, func: async () => { await nodeStore.saveCurrentFile() }, mode: '' },
  { icon: PreviewIcon, func: () => { toggleInspector('preview') }, mode: 'preview' },
  { icon: MetaIcon, func: () => { toggleInspector('meta') }, mode: 'meta' },
] as const
const sidebarIcons = [
  { icon: SidebarToggleIcon },
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

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault();

      const file = item.getAsFile();
      if (file) {
        try {
          const newFile = new File(
            [file], insertTimeToFileName(file.name), { type: file.type }
          );
          const filename = await nodeStore.uploadFile(newFile, uploadPercent)
          insertText(`![${filename}](${filename})`);
        } catch (e) {
          console.log(`Failed to paste the file: ${e}`)
        }
      }
      return; 
    }
  }
}

const insertText = (text: string) => {
  const textarea = markdownEditorRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const originalText = nodeStore.currentFile.content;

  nodeStore.currentFile.content = 
    originalText.substring(0, start) + 
    text + 
    originalText.substring(end);

  nextTick(() => {
    textarea.focus();
    const newCursorPos = start + text.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  });
};
</script>
