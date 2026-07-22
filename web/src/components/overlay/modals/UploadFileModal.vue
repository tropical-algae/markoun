<template>
  <BaseModal
    v-model="isVisible"
    title="Upload File"
  >
    <ModalContentLayout size="md">

      <input
        :id="fileInputId"
        name="file"
        type="file"
        class="upload-file-input"
        @change="handleFileSelect"
      />

      <label
        v-if="!isUploading"
        :for="fileInputId"
        class="upload-drop-zone"
        :class="{ 'is-dragover': isDragOver }"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
      >
        <component :is="UploadIcon" class="upload-icon"></component>
        <p class="upload-title">Click or Drag file to this area</p>
        <p class="upload-subtitle">Upload to: {{ nodeStore.currentPathLabel }}</p>
      </label>

      <div v-else class="upload-state">
        <div class="upload-progress-row">
          <div class="upload-progress-body">
            <div class="upload-progress-labels">
              <span class="upload-file-text">{{ currentFileName }}</span>
              <span class="progress-text">{{ uploadPercent }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: uploadPercent + '%' }"></div>
            </div>
          </div>
        </div>
        <p class="upload-status-text f-s fc-sec">
          <span>Uploading...</span>
        </p>
      </div>

      <template #actions>
        <GhostButton
          class="modal-button f-s"
          @click="isVisible = false"
          theme="secondary"
          :disabled="nodeStore.isUploadPending()"
        >
          Cancel
        </GhostButton>
      </template>

    </ModalContentLayout>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useNodeStore } from '@/stores/note'
import { useFileUploadTask } from '@/composables/useFileUploadTask'

import UploadIcon from '@/assets/icons/upload.svg'

import BaseModal from '@/components/base/BaseModal.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import ModalContentLayout from '@/layouts/ModalContentLayout.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const nodeStore = useNodeStore()
const {
  isUploading,
  uploadPercent,
  currentFileName,
  uploadFile,
} = useFileUploadTask()

const fileInputId = useId()
const isDragOver = ref(false)

const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    if (isUploading.value && !value) {
      return
    }

    emit('update:modelValue', value)
  },
})

const handleFileSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await handleUpload(file)
  }
  input.value = ''
}

const handleDrop = async (e: DragEvent) => {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    await handleUpload(file)
  }
}

const handleUpload = async (file: File) => {
  await uploadFile(file)
  isVisible.value = false
}
</script>


<style scoped>
.upload-file-input {
  display: none;
}

.upload-drop-zone {
  margin-bottom: var(--space-lg);
  padding-inline: var(--space-xl);
  border: var(--control-line-width) dashed var(--color-line);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-sec);
  height: var(--upload-dropzone-height);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition:
    border-color var(--motion-medium-duration) ease,
    background-color var(--motion-medium-duration) ease;
}

.upload-drop-zone.is-dragover {
  border-color: var(--color-action);
  background-color: var(--color-action-light);
}

@media (hover: hover) {
  .upload-drop-zone:hover {
    border-color: var(--color-action);
    background-color: var(--color-action-light);
  }
}

.upload-drop-zone .upload-icon {
  width: var(--upload-icon-size);
  height: var(--upload-icon-size);
  fill: var(--color-text-sec);
  margin-bottom: var(--space-lg);
}

.upload-drop-zone .upload-title {
  max-width: 100%;
  color: var(--color-action);
  font-weight: bold;
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-xs);
}

.upload-drop-zone .upload-subtitle {
  max-width: 100%;
  color: var(--color-text-sec);
  font-size: var(--font-size-md);
  margin: 0;
  overflow-wrap: anywhere;
}

.upload-state {
  margin-bottom: var(--space-lg);
  height: var(--upload-dropzone-height);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 var(--space-xl);
}

.upload-progress-row {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-xs);
}

.upload-progress-body {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

.upload-progress-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.upload-file-text {
  color: var(--color-text-sec);
  font-size: var(--font-size-md);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-status-text {
  text-align: center;
}

.progress-text {
  color: var(--color-text-sec);
  font-size: var(--font-size-md);
}

.progress-track {
  height: var(--progress-track-height);
  background-color: var(--color-bg-field);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-action);
  transition: width var(--motion-soft-duration) linear;
}
</style>
