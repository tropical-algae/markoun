<template>
  <div
    class="editor-wrapper px-3"
    :class="{
      'is-resizing': isInspectorResizing,
      'is-wide-lines': appearanceStore.useWideEditorLines,
    }"
  >
    <BaseHeader>
      <div class="col-auto d-flex justify-content-start flex-shrink-0 gap-2 ps-1">
        <BaseTooltip v-for="item in sidebarIcons" :key="item.label" :text="item.label" placement="bottom">
          <button
            @click="item.func()"
            :disabled="nodeStore.isSavePending()"
            :aria-label="item.label"
          >
            <component :is="item.icon" class="icon-btn" :class="{ 'is-pending': nodeStore.isSavePending() }"></component>
          </button>
        </BaseTooltip>
      </div>

      <div class="editor-title-slot col px-3">
        <span class="d-block text-truncate text-center fc-pri">
          {{ nodeStore.currentFileDisplayName }}
        </span>
      </div>

      <div class="col-auto d-flex justify-content-end flex-shrink-0 gap-2 pe-1">
        <BaseTooltip
          v-for="item in inspectIcons"
          :key="item.label"
          :text="item.label"
          placement="bottom"
        >
          <button
            :class="{ active: showInspector && currentMode === item.mode }"
            @click="toggleInspector(item.mode)"
            :aria-label="item.label"
            :aria-pressed="showInspector && currentMode === item.mode"
          >
            <component :is="item.icon" class="icon-btn"></component>
          </button>
        </BaseTooltip>
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

        <div class="editor-ready-state fc-pri">
          <textarea
            v-model="nodeStore.currentFile.content"
            ref="markdownEditorRef"
            class="markdown-editor touch-scroll"
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
    :class="{ 'is-smooth': !isInspectorResizing, 'is-open': showInspector }"
    :inert="!showInspector"
    :aria-hidden="!showInspector"
  >
    <div class="inspector-container f-m px-3" :style="{ width: inspectorWidth + 'px' }">
      <div v-if="currentMode === InspectMode.Meta" class="d-flex flex-column h-100 overflow-hidden p-0 small">
        <BaseHeader>
          <div class="inspector-header-content">
            <div class="text-uppercase f-s fc-pri">File Meta</div>
            <button
              class="inspector-close-button"
              type="button"
              aria-label="Close inspector"
              @click="showInspector = false"
            >
              x
            </button>
          </div>
        </BaseHeader>
        <AsyncGate
          :status="nodeStore.currentFileStatus"
          :show-delay-ms="editorAsyncGateDelayMs"
          tag="div"
          class="note-meta touch-scroll"
        >
          <template #loading>
            <div class="inspector-skeleton">
              <BaseSkeleton width="46%" height="0.85rem" />
              <BaseSkeleton width="68%" height="0.85rem" />
              <BaseSkeleton width="52%" height="0.85rem" />
            </div>
          </template>

          <div class="meta-grid">
            <div class="meta-key fc-sec">characters:</div>
            <div class="meta-value fc-sec">{{ nodeStore.currentFile.content.length }}</div>
            <template
              v-for="(value, key) in nodeStore.currentFile.meta"
              :key="key"
            >
              <div class="meta-key fc-sec">{{ key }}:</div>
              <div class="meta-value fc-sec">{{ value }}</div>
            </template>
          </div>
        </AsyncGate>
      </div>

      <div v-else-if="currentMode === InspectMode.Preview" class="d-flex flex-column h-100 overflow-hidden p-0">
        <BaseHeader>
          <div class="inspector-header-content">
            <div class="text-uppercase f-s fc-pri">Preview</div>
            <button
              class="inspector-close-button"
              type="button"
              aria-label="Close inspector"
              @click="showInspector = false"
            >
              x
            </button>
          </div>
        </BaseHeader>
        <AsyncGate
          :status="nodeStore.currentFileStatus"
          :show-delay-ms="editorAsyncGateDelayMs"
          tag="div"
          class="note-preview touch-scroll"
        >
          <template #loading>
            <div class="preview-skeleton">
              <BaseSkeleton width="42%" height="0.9rem" />
              <BaseSkeleton height="0.85rem" />
              <BaseSkeleton width="74%" height="0.85rem" />
              <BaseSkeleton height="180px" radius="12px" />
            </div>
          </template>

          <div v-html="nodeStore.currentRenderedFile" class="fc-pri"></div>
        </AsyncGate>
      </div>
    </div>
    <div class="vertical-line turn-left col-drag" @pointerdown.prevent="startResizing" :class="{ 'is-resizing': isInspectorResizing }"></div>
  </aside>

</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';

import PreviewIcon from "@/assets/icons/overview.svg"
import MetaIcon from "@/assets/icons/info.svg"
import SaveIcon from "@/assets/icons/disk.svg"

import { useNodeStore } from '@/stores/note';
import { useAppearanceStore } from '@/stores/appearance';
import { useResizablePane } from '@/composables/useResizablePane';
import { InspectMode } from '@/types/ui';
import { insertTimeToFileName } from '@/utils/file-system';
import { readCssNumber, readCssTimeMs } from '@/utils/css';

import BaseHeader from '@/components/base/BaseHeader.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import AsyncGate from '@/components/base/AsyncGate.vue';
import BaseTooltip from '@/components/base/BaseTooltip.vue';

const nodeStore = useNodeStore()
const appearanceStore = useAppearanceStore()

const showInspector = ref(false);
const {
  width: inspectorWidth,
  isResizing: isInspectorResizing,
  startResizing,
  visibleWidth,
} = useResizablePane({
  initialWidth: readCssNumber('--layout-inspector-width-default', 250),
  minWidth: readCssNumber('--layout-inspector-width-min', 200),
  maxWidth: readCssNumber('--layout-inspector-width-max', 600),
  direction: 'left',
})

const currentMode = ref<InspectMode>(InspectMode.Meta);
const currentWidth = visibleWidth(showInspector);

const fileUploadPercent = ref(0);
const markdownEditorRef = ref<HTMLTextAreaElement | null>(null);
const editorAsyncGateDelayMs = readCssTimeMs('--editor-async-gate-delay-ms', 0);

const inspectIcons = [
  { icon: MetaIcon, label: 'File meta', mode: InspectMode.Meta },
  { icon: PreviewIcon, label: 'Preview', mode: InspectMode.Preview },
] as const
const sidebarIcons = [
  { icon: SaveIcon, label: 'Save note', func: async () => { await nodeStore.saveCurrentFile(); } },
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

.editor-wrapper {
  --editor-content-padding-x: calc(max(var(--editor-content-padding-x-min), (100% - var(--editor-content-max-width)) / 2));

  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: var(--color-bg-sec);
  overflow: hidden; 
  transition: background-color var(--motion-theme-duration) ease;
}

.editor-wrapper.is-wide-lines {
  --editor-content-padding-x: var(--editor-content-padding-x-min);
}

.editor-wrapper .floating-left {
  position: absolute;
  left: var(--editor-floating-inline-offset);
  display: flex;
  gap: var(--editor-floating-gap);
}

.editor-wrapper .floating-right {
  position: absolute;
  right: var(--editor-floating-inline-offset);
  display: flex;
  gap: var(--editor-floating-gap);
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

.editor-ready-state {
  position: relative;
}

.markdown-editor {
  width: 100%;
  height: 100%;

  padding: var(--editor-content-padding-y) var(--editor-content-padding-x);

  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text-pri);
  font-size: 16px;
  line-height: var(--editor-line-height);
  resize: none;
  box-sizing: border-box;
  
	overflow-y: scroll;
}

.markdown-editor::input-placeholder{
	color: var(--color-text-muted);
}
.markdown-editor::-webkit-input-placeholder{
	color: var(--color-text-muted);
}
.markdown-editor::-moz-placeholder{
	color: var(--color-text-muted);
}
.markdown-editor::-moz-placeholder{
	color: var(--color-text-muted);
}
.markdown-editor::-ms-input-placeholder{
	color: var(--color-text-muted);
}

.editor-loading-state {
  padding: var(--editor-content-padding-y) var(--editor-content-padding-x);
  display: flex;
  flex-direction: column;
  gap: var(--editor-loading-gap);
}

.editor-skeleton-line {
  flex-shrink: 0;
}

.icon-btn.is-pending {
  opacity: 0.55;
}

.inspector-wrapper {
  position: relative;
  overflow: hidden; 
  flex-shrink: 0;
  background-color: var(--color-bg-sec);
  transition: background-color var(--motion-theme-duration) ease;
}

.inspector-container {
  height: 100%; 

  display: flex;
  flex-direction: column;
  white-space: nowrap; 
}

.note-meta,
.note-preview {
  flex: 1;
  margin-top: var(--editor-inspector-content-margin-top);
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
  gap: var(--editor-inspector-skeleton-gap);
}

.note-meta .meta-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  row-gap: var(--editor-meta-row-gap);
  column-gap: var(--editor-meta-column-gap);

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

.inspector-close-button {
  display: none;
}

.inspector-header-content {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

@media (max-width: 768px) {
  .editor-wrapper {
    width: 100%;
    min-height: 0;
    --editor-content-padding-y: var(--layout-mobile-editor-padding-y);
    --editor-content-padding-x-min: var(--layout-mobile-editor-padding-x-min);
  }

  .editor-wrapper :deep(.container-header) {
    padding-inline: 2px;
  }

  .inspector-wrapper {
    position: absolute;
    inset: 0;
    z-index: calc(var(--layout-mobile-layer-z-index) + 1);
    width: 0 !important;
    max-width: 100%;
    box-shadow: none;
  }

  .inspector-wrapper.is-open {
    width: 100% !important;
    box-shadow: none;
  }

  .inspector-container {
    width: 100% !important;
  }

  .inspector-wrapper .vertical-line {
    display: none;
  }

  .inspector-close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--icon-button-size);
    height: var(--icon-button-size);
    margin-left: auto;
    border-radius: var(--icon-button-radius);
    color: var(--color-text-sec);
    font-size: 1.2rem;
    line-height: 1;
  }

  .inspector-close-button:active,
  .inspector-close-button:focus-visible {
    color: var(--color-text-pri);
    background-color: var(--color-bg-selected);
  }
}
</style>
