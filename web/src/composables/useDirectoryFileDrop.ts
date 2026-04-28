import { ref, type Ref } from 'vue'

interface UseDirectoryFileDropOptions {
  isDirectory: Readonly<Ref<boolean>>;
  isUploadPending: () => boolean;
  getDestinationPath: () => string;
  selectDirectory: () => Promise<void>;
  uploadFile: (file: File, uploadPercent: Ref<number>, destinationPath: string) => Promise<unknown>;
}

const hasDraggedFiles = (event: DragEvent): boolean => {
  const types = event.dataTransfer?.types
  return Boolean(types && Array.from(types).includes('Files'))
}

export const useDirectoryFileDrop = (options: UseDirectoryFileDropOptions) => {
  const isDirectoryDragOver = ref(false)
  let dragDepth = 0

  const resetDirectoryDragState = () => {
    dragDepth = 0
    isDirectoryDragOver.value = false
  }

  const handleDirectoryDragEnter = (event: DragEvent) => {
    if (!options.isDirectory.value || !hasDraggedFiles(event)) {
      return
    }

    dragDepth += 1
    isDirectoryDragOver.value = true
  }

  const handleDirectoryDragOver = (event: DragEvent) => {
    if (!options.isDirectory.value || !hasDraggedFiles(event)) {
      return
    }

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
    isDirectoryDragOver.value = true
  }

  const handleDirectoryDragLeave = (event: DragEvent) => {
    if (!options.isDirectory.value || !hasDraggedFiles(event)) {
      return
    }

    dragDepth = Math.max(0, dragDepth - 1)
    if (dragDepth === 0) {
      isDirectoryDragOver.value = false
    }
  }

  const handleDirectoryDrop = async (event: DragEvent) => {
    if (!options.isDirectory.value || !hasDraggedFiles(event) || options.isUploadPending()) {
      resetDirectoryDragState()
      return
    }

    const file = event.dataTransfer?.files?.[0]
    resetDirectoryDragState()
    if (!file) {
      return
    }

    const uploadPercent = ref(0)
    await options.selectDirectory()
    await options.uploadFile(file, uploadPercent, options.getDestinationPath())
  }

  return {
    isDirectoryDragOver,
    resetDirectoryDragState,
    handleDirectoryDragEnter,
    handleDirectoryDragOver,
    handleDirectoryDragLeave,
    handleDirectoryDrop,
  }
}
