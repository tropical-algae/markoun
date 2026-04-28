import { onBeforeUnmount, ref } from 'vue'
import { UPLOAD_RESET_DELAY_MS } from '@/constants/ui'
import { useNodeStore } from '@/stores/note'

interface UseFileUploadTaskOptions {
  resetDelayMs?: number;
}

export const useFileUploadTask = (options: UseFileUploadTaskOptions = {}) => {
  const nodeStore = useNodeStore()
  const resetDelayMs = options.resetDelayMs ?? UPLOAD_RESET_DELAY_MS

  const isUploading = ref(false)
  const uploadPercent = ref(0)
  const currentFileName = ref('')
  const uploadedFileName = ref('')
  let resetTimer: number | null = null

  const clearResetTimer = () => {
    if (resetTimer !== null) {
      window.clearTimeout(resetTimer)
      resetTimer = null
    }
  }

  const resetUploadState = () => {
    isUploading.value = false
    uploadPercent.value = 0
    currentFileName.value = ''
    uploadedFileName.value = ''
    resetTimer = null
  }

  const uploadFile = async (file: File, destinationPath?: string): Promise<string> => {
    clearResetTimer()
    isUploading.value = true
    uploadPercent.value = 0
    currentFileName.value = file.name
    uploadedFileName.value = ''

    try {
      const filename = destinationPath === undefined
        ? await nodeStore.uploadFile(file, uploadPercent)
        : await nodeStore.uploadFile(file, uploadPercent, destinationPath)

      uploadedFileName.value = filename
      resetTimer = window.setTimeout(resetUploadState, resetDelayMs)
      return filename
    } catch (error) {
      resetUploadState()
      throw error
    }
  }

  onBeforeUnmount(() => {
    clearResetTimer()
  })

  return {
    isUploading,
    uploadPercent,
    currentFileName,
    uploadedFileName,
    uploadFile,
    resetUploadState,
  }
}
