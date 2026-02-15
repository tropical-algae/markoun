<template>
  <BaseModal 
    v-model="isVisible" 
    title="Upload File"
  >
    <div style="width: 420px;">
      
      <input 
        type="file" 
        ref="fileInputRef" 
        style="display: none;"
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
        <p class="upload-subtitle m-0">Upload to: {{ nodeStore.currentPath }}</p>
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
        <GhostButton @click="isVisible = false" theme="secondary">Cancel</GhostButton>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNodeStore } from '@/scripts/stores/note';

import UploadIcon from "@/assets/icons/upload.svg"

import BaseModal from '@/components/common/BaseModal.vue'
import GhostButton from '@/components/common/GhostButton.vue';

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const nodeStore = useNodeStore()

// 状态管理
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadPercent = ref(0)
const currentFileName = ref('')
const uploadedFileName = ref('')

const isVisible = computed({
  get: () => props.modelValue,
  set: (val) => {
    if (isUploading.value && !val) return 
    emit('update:modelValue', val)
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
  isUploading.value = true
  uploadPercent.value = 0
  currentFileName.value = file.name
  uploadedFileName.value = await nodeStore.uploadFile(file, uploadPercent)
  setTimeout(() => {
    isUploading.value = false
    uploadPercent.value = 0
    currentFileName.value = ''
    uploadedFileName.value = ''
  }, 5000)
}
</script>
