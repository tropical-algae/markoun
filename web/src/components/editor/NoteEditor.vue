<template>
  <EditorLayout
    v-model:inspector-open="showInspector"
    :wide-lines="appearanceStore.useWideEditorLines"
  >
    <template #header>
      <NoteEditorHeader
        :title="nodeStore.currentFileDisplayName"
        :save-pending="nodeStore.isSavePending()"
        :inspector-open="showInspector"
        :active-mode="currentMode"
        @save="saveCurrentFile"
        @toggle-inspector="toggleInspector"
      />
    </template>

    <AsyncGate
      :status="nodeStore.currentFileStatus"
      :show-delay-ms="editorAsyncGateDelayMs"
      tag="div"
      class="editor-gate"
    >
      <template #loading>
        <div class="editor-loading-state">
          <BaseSkeleton
            width="var(--skeleton-width-sm)"
            height="var(--skeleton-text-height-lg)"
            class="editor-skeleton-line"
          />
          <BaseSkeleton
            height="var(--skeleton-height-default)"
            class="editor-skeleton-line"
          />
          <BaseSkeleton
            width="var(--skeleton-width-md)"
            height="var(--skeleton-height-default)"
            class="editor-skeleton-line"
          />
          <BaseSkeleton
            height="var(--skeleton-height-default)"
            class="editor-skeleton-line"
          />
          <BaseSkeleton
            width="var(--skeleton-width-lg)"
            height="var(--skeleton-height-default)"
            class="editor-skeleton-line"
          />
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
          @keydown.ctrl.s.prevent="saveCurrentFile"
          @keydown.meta.s.prevent="saveCurrentFile"
        ></textarea>
      </div>
    </AsyncGate>

    <template #inspector="{ closeInspector }">
      <NoteInspectorPanels
        :mode="currentMode"
        :status="nodeStore.currentFileStatus"
        :show-delay-ms="editorAsyncGateDelayMs"
        :content-length="nodeStore.currentFile.content.length"
        :meta="nodeStore.currentFile.meta"
        :rendered-html="nodeStore.currentRenderedFile"
        @close="closeInspector"
      />
    </template>
  </EditorLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { useNodeStore } from '@/stores/note'
import { useAppearanceStore } from '@/stores/appearance'
import { InspectMode } from '@/types/ui'
import { readCssTimeMs } from '@/utils/css'
import { useMarkdownPasteUpload } from '@/composables/useMarkdownPasteUpload'

import EditorLayout from '@/layouts/EditorLayout.vue'
import NoteEditorHeader from '@/components/editor/NoteEditorHeader.vue'
import NoteInspectorPanels from '@/components/editor/NoteInspectorPanels.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import AsyncGate from '@/components/base/AsyncGate.vue'

const nodeStore = useNodeStore()
const appearanceStore = useAppearanceStore()

const showInspector = ref(false)
const currentMode = ref<InspectMode>(InspectMode.Meta)

const markdownEditorRef = ref<HTMLTextAreaElement | null>(null)
const editorAsyncGateDelayMs = readCssTimeMs('--editor-async-gate-delay-ms', 0)
const { handlePaste } = useMarkdownPasteUpload({
  textareaRef: markdownEditorRef,
  getContent: () => nodeStore.currentFile.content,
  setContent: (content) => {
    nodeStore.currentFile.content = content
  },
  getFilePath: () => nodeStore.currentFile.path,
})

const saveCurrentFile = async () => {
  await nodeStore.saveCurrentFile()
}

const toggleInspector = (mode: InspectMode) => {
  const shouldExpand = currentMode.value !== mode || !showInspector.value
  showInspector.value = shouldExpand
  if (shouldExpand) {
    currentMode.value = mode
  }
}

</script>

<style scoped>
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
  font-size: var(--editor-font-size);
  line-height: var(--editor-line-height);
  resize: none;
  box-sizing: border-box;

  overflow-y: scroll;
}

.markdown-editor::placeholder {
  color: var(--color-text-muted);
}

.editor-loading-state {
  padding: var(--editor-content-padding-y) var(--editor-content-padding-x);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-width: 0;
  box-sizing: border-box;
}

.editor-skeleton-line {
  flex-shrink: 0;
}

</style>
