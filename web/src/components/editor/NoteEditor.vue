<template>
  <EditorLayout
    :wide-lines="appearanceStore.useWideEditorLines"
  >
    <template #header>
      <NoteEditorHeader
        :title="nodeStore.currentFileDisplayName"
        :save-pending="nodeStore.isSavePending()"
        :inspector-open="inspectorOpen"
        :active-mode="inspectorMode"
        @save="saveCurrentFile"
        @toggle-inspector="emit('toggleInspector', $event)"
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
  </EditorLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { useNodeStore } from '@/stores/note'
import { useAppearanceStore } from '@/stores/appearance'
import type { InspectorMode } from '@/types/ui'
import { readCssTimeMs } from '@/utils/css'
import { useMarkdownPasteUpload } from '@/composables/useMarkdownPasteUpload'

import EditorLayout from '@/layouts/EditorLayout.vue'
import NoteEditorHeader from '@/components/editor/NoteEditorHeader.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import AsyncGate from '@/components/base/AsyncGate.vue'

defineProps<{
  inspectorOpen: boolean
  inspectorMode: InspectorMode
}>()

const emit = defineEmits<{
  (event: 'toggleInspector', mode: InspectorMode): void
}>()

const nodeStore = useNodeStore()
const appearanceStore = useAppearanceStore()

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
