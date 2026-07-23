import { ref } from 'vue'
import { useNodeStore } from '@/stores/note'
import type { PastedImageResponse, UploadResponse } from '@/types/file-system'

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

  const runUpload = async <T>(file: File, task: () => Promise<T>): Promise<T> => {
    isUploading.value = true
    uploadPercent.value = 0
    currentFileName.value = file.name

    try {
      return await task()
    } finally {
      resetUploadState()
    }
  }

  const uploadFile = (file: File, destinationPath?: string): Promise<UploadResponse> => {
    return runUpload(file, () => destinationPath === undefined
      ? nodeStore.uploadFile(file, uploadPercent)
      : nodeStore.uploadFile(file, uploadPercent, destinationPath))
  }

  const uploadPastedImage = (file: File, notePath: string): Promise<PastedImageResponse> => {
    return runUpload(file, () => nodeStore.uploadPastedImage(file, notePath, uploadPercent))
  }

  return {
    isUploading,
    uploadPercent,
    currentFileName,
    uploadFile,
    uploadPastedImage,
    resetUploadState,
  }
}
