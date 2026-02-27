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
    :class="{ 'anim-width': !isInspectorResizing }"
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

import { useNodeStore } from '@/scripts/stores/note';
import { InspectMode } from '@/scripts/types';
import { insertTimeToFileName } from '@/scripts/utils/util';

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
