import { computed, ref } from 'vue'
import type { AsyncStatus } from '@/types/async'
import type { FileDetail, FileDetailResponse, FsNode } from '@/types/file-system'
import { DEFAULT_WELCOME_NOTE_CONTENT } from '@/constants/note'
import {
  buildFileDetailShell,
  remapFileDetailPathPrefix,
  remapOptionalFsNodePathPrefix,
} from '@/utils/file-node'
import { renderMarkdownFile } from '@/utils/markdown'

const createDefaultFileContent = (
  content: string = DEFAULT_WELCOME_NOTE_CONTENT,
): FileDetail => ({
  name: 'WELCOME',
  path: '',
  suffix: '',
  content,
  meta: {},
})

export const useCurrentFileState = () => {
  const currentFileNode = ref<FsNode | null>(null)
  const currentFile = ref<FileDetail>(createDefaultFileContent())
  const currentFileStatus = ref<AsyncStatus>('idle')
  const welcomeNoteContent = ref(DEFAULT_WELCOME_NOTE_CONTENT)
  const welcomeNoteState = ref<AsyncStatus>('idle')
  const lastSavedContent = ref(createDefaultFileContent().content)
  const isCurrentFileInitialized = ref(false)

  let currentFileRequestId = 0

  const currentFileDisplayName = computed(() => {
    return currentFileNode.value?.name || currentFile.value.name
  })
  const canEditCurrentFile = computed(() => {
    return currentFileStatus.value === 'ready' && Boolean(currentFileNode.value)
  })
  const isCurrentFileDirty = computed(() => {
    return canEditCurrentFile.value && currentFile.value.content !== lastSavedContent.value
  })
  const currentRenderedFile = computed(() => {
    return renderMarkdownFile(currentFile.value.path, currentFile.value.content)
  })

  const resolveDefaultFileStatus = (): AsyncStatus => {
    return welcomeNoteState.value === 'ready' || welcomeNoteState.value === 'error'
      ? 'ready'
      : 'idle'
  }

  const syncDefaultWelcomeFile = () => {
    if (currentFileNode.value || isCurrentFileInitialized.value) {
      return
    }

    currentFile.value = createDefaultFileContent(welcomeNoteContent.value)
  }

  const resetCurrentFileState = () => {
    currentFileNode.value = null
    currentFile.value = createDefaultFileContent(welcomeNoteContent.value)
    lastSavedContent.value = currentFile.value.content
    currentFileStatus.value = resolveDefaultFileStatus()
    isCurrentFileInitialized.value = false
  }

  const beginWelcomeNoteLoad = () => {
    welcomeNoteState.value = 'loading'
    if (!currentFileNode.value && !isCurrentFileInitialized.value) {
      currentFileStatus.value = 'loading'
    }
  }

  const completeWelcomeNoteLoad = (content: string) => {
    welcomeNoteContent.value = content || DEFAULT_WELCOME_NOTE_CONTENT
    welcomeNoteState.value = 'ready'
    syncDefaultWelcomeFile()
    if (!currentFileNode.value && !isCurrentFileInitialized.value) {
      currentFileStatus.value = 'ready'
    }
  }

  const failWelcomeNoteLoad = () => {
    welcomeNoteState.value = 'error'
    welcomeNoteContent.value = DEFAULT_WELCOME_NOTE_CONTENT
    syncDefaultWelcomeFile()
    if (!currentFileNode.value && !isCurrentFileInitialized.value) {
      currentFileStatus.value = 'ready'
    }
  }

  const beginFileLoad = (node: FsNode): number => {
    const requestId = ++currentFileRequestId
    currentFileNode.value = node
    currentFile.value = buildFileDetailShell(node)
    currentFileStatus.value = 'loading'
    isCurrentFileInitialized.value = false
    return requestId
  }

  const isStaleFileRequest = (requestId: number, node: FsNode): boolean => {
    return requestId !== currentFileRequestId || currentFileNode.value?.path !== node.path
  }

  const completeFileLoad = (
    requestId: number,
    node: FsNode,
    detail: FileDetailResponse,
  ) => {
    if (isStaleFileRequest(requestId, node)) {
      return
    }

    const nextFile = {
      name: node.name,
      path: node.path,
      suffix: node.suffix,
      content: detail.content,
      meta: detail.meta,
    }
    currentFile.value = nextFile
    lastSavedContent.value = nextFile.content
    currentFileStatus.value = 'ready'
    isCurrentFileInitialized.value = true
  }

  const failFileLoad = (requestId: number, node: FsNode) => {
    if (isStaleFileRequest(requestId, node)) {
      return
    }

    currentFileStatus.value = 'error'
    currentFile.value = buildFileDetailShell(node)
  }

  const markSavedContent = (content: string) => {
    lastSavedContent.value = content
  }

  const updateCurrentFileMeta = (meta: Record<string, string>) => {
    currentFile.value.meta = meta
  }

  const remapCurrentFilePathPrefix = (
    oldPath: string,
    newPath: string,
    exactName: string,
  ) => {
    currentFile.value = remapFileDetailPathPrefix(
      currentFile.value,
      oldPath,
      newPath,
      exactName,
    )
  }

  const syncCurrentFileNode = (node: FsNode) => {
    if (currentFileNode.value?.path === node.path) {
      currentFileNode.value = node
    }
  }

  const clearCurrentFileNode = () => {
    currentFileNode.value = null
  }

  const remapCurrentFileNodePathPrefix = (
    oldPath: string,
    newPath: string,
    exactName: string,
  ) => {
    currentFileNode.value = remapOptionalFsNodePathPrefix(
      currentFileNode.value,
      oldPath,
      newPath,
      exactName,
    )
  }

  return {
    currentFileNode,
    currentFile,
    currentFileStatus,
    welcomeNoteContent,
    welcomeNoteState,
    isCurrentFileInitialized,
    currentFileDisplayName,
    canEditCurrentFile,
    isCurrentFileDirty,
    currentRenderedFile,
    syncDefaultWelcomeFile,
    resetCurrentFileState,
    beginWelcomeNoteLoad,
    completeWelcomeNoteLoad,
    failWelcomeNoteLoad,
    beginFileLoad,
    isStaleFileRequest,
    completeFileLoad,
    failFileLoad,
    markSavedContent,
    updateCurrentFileMeta,
    remapCurrentFilePathPrefix,
    syncCurrentFileNode,
    clearCurrentFileNode,
    remapCurrentFileNodePathPrefix,
  }
}
