import { ref } from 'vue'
import { useNodeStore } from '@/stores/note'

export const useFileUploadTask = () => {
  const nodeStore = useNodeStore()

  const isUploading = ref(false)
  const uploadPercent = ref(0)
  const currentFileName = ref('')

  const resetUploadState = () => {
    isUploading.value = false
    uploadPercent.value = 0
    currentFileName.value = ''
  }

  const uploadFile = async (file: File, destinationPath?: string): Promise<string> => {
    isUploading.value = true
    uploadPercent.value = 0
    currentFileName.value = file.name

    try {
      return destinationPath === undefined
        ? await nodeStore.uploadFile(file, uploadPercent)
        : await nodeStore.uploadFile(file, uploadPercent, destinationPath)
    } finally {
      resetUploadState()
    }
  }

  return {
    isUploading,
    uploadPercent,
    currentFileName,
    uploadFile,
    resetUploadState,
  }
}
