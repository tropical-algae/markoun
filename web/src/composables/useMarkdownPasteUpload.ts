import { nextTick, type Ref } from 'vue'
import { useFileUploadTask } from '@/composables/useFileUploadTask'
import { insertTimeToFileName } from '@/utils/file-system'

interface UseMarkdownPasteUploadOptions {
  textareaRef: Ref<HTMLTextAreaElement | null>
  getContent: () => string
  setContent: (content: string) => void
  getFilePath: () => string
}

interface PasteContext {
  filePath: string
  start: number
  end: number
}

export const useMarkdownPasteUpload = (options: UseMarkdownPasteUploadOptions) => {
  const { uploadPastedImage } = useFileUploadTask()

  const insertText = (text: string, context: PasteContext) => {
    const textarea = options.textareaRef.value
    if (!textarea || options.getFilePath() !== context.filePath) {
      return
    }

    const originalText = options.getContent()
    options.setContent(
      originalText.substring(0, context.start) +
      text +
      originalText.substring(context.end),
    )

    nextTick(() => {
      if (options.getFilePath() !== context.filePath) {
        return
      }
      textarea.focus()
      const newCursorPos = context.start + text.length
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
        const textarea = options.textareaRef.value
        if (!textarea) {
          return
        }
        const context: PasteContext = {
          filePath: options.getFilePath(),
          start: textarea.selectionStart,
          end: textarea.selectionEnd,
        }
        try {
          const newFile = new File(
            [file],
            insertTimeToFileName(file.name),
            { type: file.type },
          )
          const uploaded = await uploadPastedImage(newFile, context.filePath)
          const altText = uploaded.filename.replace(/([\\\]])/g, '\\$1')
          insertText(`![${altText}](${uploaded.markdown_path})`, context)
        } catch (_) {}
      }
      return
    }
  }

  return {
    handlePaste,
  }
}
