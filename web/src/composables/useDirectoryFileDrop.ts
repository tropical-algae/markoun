import { ref, type Ref } from 'vue'
import { useNodeStore } from '@/stores/note'
import { useFileUploadTask } from '@/composables/useFileUploadTask'

interface UseDirectoryFileDropOptions {
  isDirectory: Readonly<Ref<boolean>>;
  getDestinationPath: () => string;
  selectDirectory: () => Promise<void>;
}

const hasDraggedFiles = (event: DragEvent): boolean => {
  const types = event.dataTransfer?.types
  return Boolean(types && Array.from(types).includes('Files'))
}

export const useDirectoryFileDrop = (options: UseDirectoryFileDropOptions) => {
  const nodeStore = useNodeStore()
  const uploadTask = useFileUploadTask()
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
    if (!options.isDirectory.value || !hasDraggedFiles(event) || nodeStore.isUploadPending()) {
      resetDirectoryDragState()
      return
    }

    const file = event.dataTransfer?.files?.[0]
    resetDirectoryDragState()
    if (!file) {
      return
    }

    await options.selectDirectory()
    await uploadTask.uploadFile(file, options.getDestinationPath())
  }

  return {
    ...uploadTask,
    isDirectoryDragOver,
    resetDirectoryDragState,
    handleDirectoryDragEnter,
    handleDirectoryDragOver,
    handleDirectoryDragLeave,
    handleDirectoryDrop,
  }
}
