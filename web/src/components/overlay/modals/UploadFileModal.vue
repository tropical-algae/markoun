<template>
  <BaseModal 
    v-model="isVisible" 
    title="Upload File"
  >
    <div class="upload-modal">
      
      <input 
        type="file" 
        ref="fileInputRef" 
        class="upload-file-input"
        @change="handleFileSelect"
      />

      <div 
        v-if="!isUploading"
        class="upload-drop-zone mb-3"
        :class="{ 'is-dragover': isDragOver }"
        @click="triggerFileSelect"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
      >
        <component :is="UploadIcon" class="upload-icon mb-3"></component>
        <p class="upload-title mb-1">Click or Drag file to this area</p>
        <p class="upload-subtitle m-0">Upload to: {{ nodeStore.currentPathLabel }}</p>
      </div>

      <div v-else class="upload-state mb-3">
        <div class="d-flex align-items-center gap-3 mb-1">
          <div class="flex-grow-1 overflow-hidden">
            <div class="d-flex justify-content-between mb-1">
              <span class="upload-file-text">{{ currentFileName }}</span>
              <span class="progress-text">{{ uploadPercent }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: uploadPercent + '%' }"></div>
            </div>
          </div>
        </div>
        <p class="text-center text-secondary small">
          <span v-if="uploadedFileName === ''">Uploading...</span>
          <span v-else>{{ uploadedFileName }} has been uploaded.</span>
        </p>
      </div>

      <div class="d-flex justify-content-end">
        <GhostButton
          class="f-s py-0"
          @click="isVisible = false"
          theme="secondary"
          :disabled="nodeStore.isUploadPending()"
        >
          Cancel
        </GhostButton>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useNodeStore } from '@/stores/note';
import { UPLOAD_RESET_DELAY_MS } from '@/constants/ui';

import UploadIcon from "@/assets/icons/upload.svg"

import BaseModal from '@/components/base/BaseModal.vue'
import GhostButton from '@/components/base/GhostButton.vue';

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const nodeStore = useNodeStore()

// 状态管理
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadPercent = ref(0)
const currentFileName = ref('')
const uploadedFileName = ref('')
let resetTimer: number | null = null

const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    if (isUploading.value && !value) return
    emit('update:modelValue', value)
  }
})

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

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
  const file =e.dataTransfer?.files?.[0] 
  if (file) {
    await handleUpload(file)
  }
}

const handleUpload = async (file: File) => {
  if (resetTimer !== null) {
    window.clearTimeout(resetTimer)
    resetTimer = null
  }

  isUploading.value = true
  uploadPercent.value = 0
  currentFileName.value = file.name
  try {
    uploadedFileName.value = await nodeStore.uploadFile(file, uploadPercent)
  } catch (error) {
    resetUploadState()
    throw error
  }

  resetTimer = window.setTimeout(
    resetUploadState,
    UPLOAD_RESET_DELAY_MS,
  )
}

const resetUploadState = () => {
  isUploading.value = false
  uploadPercent.value = 0
  currentFileName.value = ''
  uploadedFileName.value = ''
  resetTimer = null
}

onBeforeUnmount(() => {
  if (resetTimer !== null) {
    window.clearTimeout(resetTimer)
  }
})
</script>


<style scoped>

.upload-modal {
  width: var(--modal-width-md);
}

.upload-file-input {
  display: none;
}

.upload-drop-zone {
  border: 1.5px dashed var(--color-line);
  border-radius: var(--radius-2xl);
  background-color: var(--color-bg-sec);
  height: var(--upload-dropzone-height);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    border-color var(--motion-medium-duration) ease,
    background-color var(--motion-medium-duration) ease;
}

.upload-drop-zone:hover, .upload-drop-zone.is-dragover {
  border-color: var(--color-action);
  background-color: var(--color-action-light);
}

.upload-drop-zone .upload-icon {
  width: var(--upload-icon-size);
  height: var(--upload-icon-size);
  fill: var(--color-text-sec);
}

.upload-drop-zone .upload-title {
  color: var(--color-action);
  font-weight: bold;
  font-size: 1.1rem;
}

.upload-drop-zone .upload-subtitle {
  color: var(--color-text-sec);
  font-size: 0.9rem;
}

.upload-state {
  height: var(--upload-dropzone-height);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 var(--upload-state-padding-x);
}

.upload-file-text {
  color: var(--color-text-sec);
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-text {
  color: var(--color-text-sec);
  font-size: 0.9rem;
}

.progress-track {
  height: var(--progress-track-height);
  background-color: var(--color-bg-field);
  border-radius: var(--progress-track-radius);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-action);
  transition: width var(--progress-transition-duration) linear;
}
</style>
