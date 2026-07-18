import { nextTick, type Ref } from 'vue'
import { useFileUploadTask } from '@/composables/useFileUploadTask'
import { insertTimeToFileName } from '@/utils/file-system'

interface UseMarkdownPasteUploadOptions {
  textareaRef: Ref<HTMLTextAreaElement | null>
  getContent: () => string
  setContent: (content: string) => void
  getUploadPath: () => string
}

export const useMarkdownPasteUpload = (options: UseMarkdownPasteUploadOptions) => {
  const { uploadFile } = useFileUploadTask()

  const insertText = (text: string) => {
    const textarea = options.textareaRef.value
    if (!textarea) {
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const originalText = options.getContent()
    options.setContent(
      originalText.substring(0, start) +
      text +
      originalText.substring(end),
    )

    nextTick(() => {
      textarea.focus()
      const newCursorPos = start + text.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    })
  }

  const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (!items) {
      return
    }

    for (const item of items) {
      if (!item.type.startsWith('image/')) {
        continue
      }

      event.preventDefault()
      const file = item.getAsFile()
      if (file) {
        try {
          const newFile = new File(
            [file],
            insertTimeToFileName(file.name),
            { type: file.type },
          )
          const filename = await uploadFile(newFile, options.getUploadPath())
          insertText(`![${filename}](${filename})`)
        } catch (_) {}
      }
      return
    }
  }

  return {
    handlePaste,
  }
}
