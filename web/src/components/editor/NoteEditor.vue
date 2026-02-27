<template>
  <div class="editor-wrapper" :class="{ 'is-resizing': isInspectorResizing }">
    <BaseHeader>
      <div class="col-auto d-flex justify-content-start flex-shrink-0 gap-2 ps-1">
        <button v-for="item in sidebarIcons" @click="item.func()">
          <component :is="item.icon" class="icon-btn"></component>
        </button>
      </div>

      <div class="col px-3" style="min-width: 0;">
        <span class="d-block text-truncate text-muted text-center">
          {{ nodeStore.currentFile.name }}
        </span>
      </div>

      <div class="col-auto d-flex justify-content-end flex-shrink-0 gap-2 pe-1">
        <button 
          v-for="item in inspectIcons" 
          :class="{ active: showInspector && currentMode === item.mode }"
          @click="toggleInspector(item.mode)"
        >
          <component :is="item.icon" class="icon-btn"></component>
        </button>
      </div>
    </BaseHeader>
    
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
    ref="inspectorRef"
    :style="{ width: currentWidth }"
    :class="{ 'is-smooth': !isInspectorResizing }"
  >
    <div class="inspector-container" :style="{ width: inspectorWidth + 'px' }">
      <div v-if="currentMode === InspectMode.Meta" class="d-flex flex-column h-100 overflow-hidden p-0 small text-muted">
        <BaseHeader class="px-3">
          <div class="small text-muted uppercase">File Meta</div>
        </BaseHeader>
        <div class="note-meta px-3">
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

      <div v-else-if="currentMode === InspectMode.Preview" class="d-flex flex-column h-100 overflow-hidden p-0">
        <BaseHeader class="px-3">
          <div class="small text-muted uppercase">Preview</div>
        </BaseHeader>
        <div class="note-preview px-3" v-html="nodeStore.currrentRenderedFile"></div>
      </div>
    </div>
    <div class="vertical-line turn-left col-drag" @mousedown="startResizing" :class="{ 'is-resizing': isInspectorResizing }"></div>
  </aside>

</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';

import PreviewIcon from "@/assets/icons/overview.svg"
import MetaIcon from "@/assets/icons/info.svg"
import SaveIcon from "@/assets/icons/disk.svg"

import { useNodeStore } from '@/stores/note';
import { InspectMode } from '@/types/ui';
import { insertTimeToFileName } from '@/utils/file-system';

import BaseHeader from '@/components/base/BaseHeader.vue';

const nodeStore = useNodeStore()

const inspectorWidth = ref(250);
const inspectorMaxWidth = 200;
const inspectorMinWidth = 600;
const showInspector = ref(false);
const isInspectorResizing = ref(false);

const currentMode = ref<InspectMode>(InspectMode.Meta);
const currentWidth = computed(() => showInspector.value ? `${inspectorWidth.value}px` : '0px');

const fileUploadPercent = ref(0);
const markdownEditorRef = ref<HTMLTextAreaElement | null>(null);

const inspectIcons = [
  { icon: MetaIcon, mode: InspectMode.Meta },
  { icon: PreviewIcon, mode: InspectMode.Preview },
] as const
const sidebarIcons = [
  { icon: SaveIcon, func: async () => { await nodeStore.saveCurrentFile() } },
] as const

const toggleInspector = (mode: InspectMode) => {
  const shouldExpand = currentMode.value !== mode || !showInspector.value;
  showInspector.value = shouldExpand;
  if (shouldExpand) {
    currentMode.value = mode;
  }
};

const startResizing = (e: MouseEvent) => {
  isInspectorResizing.value = true;
  const startX = e.clientX;
  const startWidth = inspectorWidth.value;

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isInspectorResizing.value) return;

    const deltaX = startX - moveEvent.clientX;
    let newWidth = startWidth + deltaX;

    if (newWidth < inspectorMaxWidth) newWidth = inspectorMaxWidth;
    if (newWidth > inspectorMinWidth) newWidth = inspectorMinWidth;

    inspectorWidth.value = newWidth;
  };

  const onMouseUp = () => {
    isInspectorResizing.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
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
          const filename = await nodeStore.uploadFile(newFile, fileUploadPercent)
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

<style scoped>

/* 编辑器部分 */

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: var(--color-bg-sec);
  overflow: hidden; 
}

.editor-wrapper .floating-left {
  position: absolute;
  left: 16px;
  display: flex;
  gap: 8px;
}

.editor-wrapper .floating-right {
  position: absolute;
  right: 16px;
  display: flex;
  gap: 8px;
}

.editor-container {
  flex: 1;
  display: flex;
  justify-content: center;
  overflow: hidden; 
}

.markdown-editor {
  width: 100%;
  height: 100%;

  padding: 30px calc(max(20px, (100% - 800px) / 2));

  border: none;
  outline: none;
  background: transparent;
  color: var(--text-main);
  font-size: 16px;
  line-height: 1.6;
  resize: none;
  box-sizing: border-box;
  
	overflow-y: scroll;
}

/* 侧边栏信息部分 */

.inspector-wrapper {
  position: relative;
  overflow: hidden; 
  flex-shrink: 0;
}

.inspector-container {
  height: 100%; 
  font-size: 14px;

  display: flex;
  flex-direction: column;
  white-space: nowrap; 
}

.inspector-title {
  height: 48px;
  display: flex;
  align-items: center;
	border-bottom: 1px solid var(--color-line);
  margin: 0 24px;
}

.note-meta,
.note-preview {
  flex: 1;
  /* padding-left: 24px;
  padding-right: 24px; */
  margin-top: 12px;
  content-visibility: auto; 
  contain: layout paint style;
  overflow-y: scroll;
  overflow-x: hidden;
  white-space: normal;
}

.note-meta .meta-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  row-gap: 8px;
  column-gap: 16px;

  align-items: start;
}

.note-meta .meta-key {
  white-space: nowrap;
  text-align: left;
  font-weight: 600;
}

.note-meta .meta-value {
  min-width: 40px;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: left;
}

/* 淡入淡出动画 */

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.fade-enter-to, .fade-leave-from {
  opacity: 1;
}
</style>
