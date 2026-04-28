<template>
  <div class="editor-wrapper" :class="{ 'is-resizing': isInspectorResizing }">
    <BaseHeader>
      <div class="col-auto d-flex justify-content-start flex-shrink-0 gap-2 ps-1">
        <button v-for="item in sidebarIcons" @click="item.func()" :disabled="nodeStore.isSavePending()">
          <component :is="item.icon" class="icon-btn" :class="{ 'is-pending': nodeStore.isSavePending() }"></component>
        </button>
      </div>

      <div class="editor-title-slot col px-3">
        <span class="d-block text-truncate text-muted text-center">
          {{ nodeStore.currentFileDisplayName }}
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
      <AsyncGate
        :status="nodeStore.currentFileStatus"
        :show-delay-ms="editorAsyncGateDelayMs"
        tag="div"
        class="editor-gate"
      >
        <template #loading>
          <div class="editor-loading-state">
            <BaseSkeleton width="48%" height="1.15rem" class="editor-skeleton-line" />
            <BaseSkeleton height="0.95rem" class="editor-skeleton-line" />
            <BaseSkeleton width="62%" height="0.95rem" class="editor-skeleton-line" />
            <BaseSkeleton height="0.95rem" class="editor-skeleton-line" />
            <BaseSkeleton width="78%" height="0.95rem" class="editor-skeleton-line" />
          </div>
        </template>

        <div class="editor-ready-state">
          <textarea
            v-model="nodeStore.currentFile.content"
            ref="markdownEditorRef"
            class="markdown-editor"
            :disabled="!nodeStore.canEditCurrentFile"
            placeholder="Start typing..."
            spellcheck="false"
            @paste="handlePaste"
          ></textarea>
        </div>
      </AsyncGate>
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
        <AsyncGate
          :status="nodeStore.currentFileStatus"
          :show-delay-ms="editorAsyncGateDelayMs"
          tag="div"
          class="note-meta px-3"
        >
          <template #loading>
            <div class="inspector-skeleton">
              <BaseSkeleton width="46%" height="0.85rem" />
              <BaseSkeleton width="68%" height="0.85rem" />
              <BaseSkeleton width="52%" height="0.85rem" />
            </div>
          </template>

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
        </AsyncGate>
      </div>

      <div v-else-if="currentMode === InspectMode.Preview" class="d-flex flex-column h-100 overflow-hidden p-0">
        <BaseHeader class="px-3">
          <div class="small text-muted uppercase">Preview</div>
        </BaseHeader>
        <AsyncGate
          :status="nodeStore.currentFileStatus"
          :show-delay-ms="editorAsyncGateDelayMs"
          tag="div"
          class="note-preview px-3"
        >
          <template #loading>
            <div class="preview-skeleton">
              <BaseSkeleton width="42%" height="0.9rem" />
              <BaseSkeleton height="0.85rem" />
              <BaseSkeleton width="74%" height="0.85rem" />
              <BaseSkeleton height="180px" radius="12px" />
            </div>
          </template>

          <div v-html="nodeStore.currentRenderedFile"></div>
        </AsyncGate>
      </div>
    </div>
    <div class="vertical-line turn-left col-drag" @mousedown="startResizing" :class="{ 'is-resizing': isInspectorResizing }"></div>
  </aside>

</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';

import PreviewIcon from "@/assets/icons/overview.svg"
import MetaIcon from "@/assets/icons/info.svg"
import SaveIcon from "@/assets/icons/disk.svg"

import { useNodeStore } from '@/stores/note';
import { useResizablePane } from '@/composables/useResizablePane';
import { InspectMode } from '@/types/ui';
import { readRootCssNumber } from '@/utils/css-vars';
import { insertTimeToFileName } from '@/utils/file-system';

import BaseHeader from '@/components/base/BaseHeader.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import AsyncGate from '@/components/base/AsyncGate.vue';

const nodeStore = useNodeStore()

const showInspector = ref(false);
const {
  width: inspectorWidth,
  isResizing: isInspectorResizing,
  startResizing,
  visibleWidth,
} = useResizablePane({
  initialWidth: readRootCssNumber('--layout-inspector-width-default', 250),
  minWidth: readRootCssNumber('--layout-inspector-width-min', 200),
  maxWidth: readRootCssNumber('--layout-inspector-width-max', 600),
  direction: 'left',
})

const currentMode = ref<InspectMode>(InspectMode.Meta);
const currentWidth = visibleWidth(showInspector);

const fileUploadPercent = ref(0);
const markdownEditorRef = ref<HTMLTextAreaElement | null>(null);
const editorAsyncGateDelayMs = readRootCssNumber('--editor-async-gate-delay-ms', 0);

const inspectIcons = [
  { icon: MetaIcon, mode: InspectMode.Meta },
  { icon: PreviewIcon, mode: InspectMode.Preview },
] as const
const sidebarIcons = [
  { icon: SaveIcon, func: async () => { await nodeStore.saveCurrentFile(); } },
] as const

const toggleInspector = (mode: InspectMode) => {
  const shouldExpand = currentMode.value !== mode || !showInspector.value;
  showInspector.value = shouldExpand;
  if (shouldExpand) {
    currentMode.value = mode;
  }
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
          const filename = await nodeStore.uploadFile(
            newFile,
            fileUploadPercent,
            nodeStore.currentFileParentPath,
          )
          insertText(`![${filename}](${filename})`);
        } catch (_) {}
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
  position: relative;
}

.editor-title-slot {
  min-width: 0;
}

.editor-gate {
  width: 100%;
  height: 100%;
}

.editor-ready-state,
.editor-loading-state {
  width: 100%;
  height: 100%;
}

.markdown-editor {
  width: 100%;
  height: 100%;

  padding: var(--editor-content-padding-y)
    calc(max(var(--editor-content-padding-x-min), (100% - var(--editor-content-max-width)) / 2));

  border: none;
  outline: none;
  background: transparent;
  color: var(--text-main);
  font-size: 16px;
  line-height: var(--editor-line-height);
  resize: none;
  box-sizing: border-box;
  
	overflow-y: scroll;
}

.editor-loading-state {
  padding: var(--editor-content-padding-y)
    calc(max(var(--editor-content-padding-x-min), (100% - var(--editor-content-max-width)) / 2));
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.editor-skeleton-line {
  flex-shrink: 0;
}

.icon-btn.is-pending {
  opacity: 0.55;
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
  height: var(--layout-header-height);
  display: flex;
  align-items: center;
	border-bottom: 1px solid var(--color-line);
  margin: 0 var(--editor-inspector-title-margin-x);
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

.inspector-skeleton,
.preview-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  min-width: var(--editor-meta-value-min-width);
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: left;
}
</style>
