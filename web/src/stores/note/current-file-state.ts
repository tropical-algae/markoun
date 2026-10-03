import { computed, ref } from 'vue'
import type { AsyncStatus } from '@/types/async'
import type { FileDetail, FileDetailResponse } from '@/types/file-system'
import { DEFAULT_WELCOME_NOTE_CONTENT } from '@/constants/note'
import { buildFileDetailShell, fileNodeFromPath, remapFileDetailPathPrefix } from '@/utils/file-node'
import { renderMarkdownFile } from '@/utils/markdown'

export interface FileContext {
  readonly file: FileDetail
  readonly path: string
}

interface FileRead extends FileContext {
  readonly id: number
}

export const useCurrentFileState = () => {
  // A welcome view is not an editable file. File identity lives only in openedFile.
  const openedFile = ref<FileDetail | null>(null)
  const fileStatus = ref<AsyncStatus>('idle')
  const welcomeNoteContent = ref(DEFAULT_WELCOME_NOTE_CONTENT)
  const welcomeNoteState = ref<AsyncStatus>('idle')
  const lastSavedContent = ref<string | null>(null)
  let requestId = 0

  const currentFile = computed<FileDetail>(() => openedFile.value ?? {
    name: 'WELCOME', path: '', suffix: '', content: welcomeNoteContent.value, meta: {},
  })
  const currentFileStatus = computed<AsyncStatus>(() => openedFile.value
    ? fileStatus.value
    : welcomeNoteState.value === 'error' ? 'ready' : welcomeNoteState.value)
  const hasCurrentFile = computed(() => openedFile.value !== null)
  const isCurrentFileInitialized = computed(() => (
    hasCurrentFile.value && lastSavedContent.value !== null
  ))
  const canEditCurrentFile = computed(() => (
    isCurrentFileInitialized.value && fileStatus.value === 'ready'
  ))
  const isCurrentFileDirty = computed(() => isCurrentFileInitialized.value
    && currentFile.value.content !== lastSavedContent.value)
  const currentFileDisplayName = computed(() => currentFile.value.name)
  const currentRenderedFile = computed(() => (
    renderMarkdownFile(currentFile.value.path, currentFile.value.content)
  ))

  // The object identifies an editing session; the snapshot path identifies its location.
  const captureFileContext = (): FileContext | null => openedFile.value
    ? { file: openedFile.value, path: openedFile.value.path }
    : null
  const isCurrentFileContext = (context: FileContext): boolean => (
    openedFile.value === context.file && openedFile.value.path === context.path
  )
  const isCurrentRead = (read: FileRead): boolean => (
    read.id === requestId && isCurrentFileContext(read)
  )

  const resetCurrentFileState = () => {
    requestId += 1
    openedFile.value = null
    fileStatus.value = 'idle'
    lastSavedContent.value = null
  }

  const beginWelcomeNoteLoad = () => {
    welcomeNoteState.value = 'loading'
  }

  const completeWelcomeNoteLoad = (content: string) => {
    welcomeNoteContent.value = content || DEFAULT_WELCOME_NOTE_CONTENT
    welcomeNoteState.value = 'ready'
  }
  const failWelcomeNoteLoad = () => {
    welcomeNoteState.value = 'error'
  }

  const beginFileLoad = (path: string): FileRead => {
    openedFile.value = buildFileDetailShell(fileNodeFromPath(path))
    lastSavedContent.value = null
    fileStatus.value = 'loading'
    return { file: openedFile.value, path, id: ++requestId }
  }

  const completeFileLoad = (read: FileRead, detail: FileDetailResponse): boolean => {
    if (!isCurrentRead(read)) return false
    Object.assign(read.file, {
      content: detail.content,
      meta: detail.meta,
    })
    lastSavedContent.value = detail.content
    fileStatus.value = 'ready'
    return true
  }
  const failFileLoad = (read: FileRead): boolean => {
    if (!isCurrentRead(read)) return false
    fileStatus.value = 'error'
    return true
  }
  const markSavedContent = (content: string) => {
    lastSavedContent.value = content
  }

  const beginRevisionLoad = (context: FileContext): FileRead | null => {
    if (!isCurrentFileContext(context)) return null
    fileStatus.value = 'loading'
    return { ...context, id: ++requestId }
  }
  const completeRevisionLoad = (read: FileRead, content: string): boolean => {
    if (!isCurrentRead(read)) return false
    read.file.content = content
    lastSavedContent.value = content
    fileStatus.value = 'ready'
    return true
  }
  const updateCurrentFileMeta = (meta: Record<string, string>) => {
    if (openedFile.value) openedFile.value.meta = meta
  }
  const remapCurrentFilePathPrefix = (oldPath: string, newPath: string, name: string) => {
    if (!openedFile.value) return
    const next = remapFileDetailPathPrefix(openedFile.value, oldPath, newPath, name)
    if (next.path !== openedFile.value.path) {
      requestId += 1
      // In-flight reads refer to the old path; the new route must reload them.
      if (fileStatus.value === 'loading') fileStatus.value = 'error'
      Object.assign(openedFile.value, next)
    }
  }

  return {
    currentFile,
    currentFileStatus,
    currentFileDisplayName,
    welcomeNoteContent,
    welcomeNoteState,
    hasCurrentFile,
    canEditCurrentFile,
    isCurrentFileDirty,
    currentRenderedFile,
    captureFileContext,
    isCurrentFileContext,
    resetCurrentFileState,
    beginWelcomeNoteLoad,
    completeWelcomeNoteLoad,
    failWelcomeNoteLoad,
    beginFileLoad,
    completeFileLoad,
    failFileLoad,
    markSavedContent,
    beginRevisionLoad,
    completeRevisionLoad,
    updateCurrentFileMeta,
    remapCurrentFilePathPrefix,
  }
}
