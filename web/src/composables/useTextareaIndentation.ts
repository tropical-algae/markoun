import { getIndentationEdit } from '@/utils/editor-indentation'

export const useTextareaIndentation = () => {
  let allowTabNavigation = false

  const resetTabNavigation = () => { allowTabNavigation = false }

  const handleEditorKeydown = (event: KeyboardEvent) => {
    // Keep Shift available for Escape followed by Shift+Tab.
    if (event.key === 'Shift') {
      return
    }
    const navigate = allowTabNavigation
    resetTabNavigation()

    if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) {
      return
    }
    if (event.key === 'Escape') {
      allowTabNavigation = true
      return
    }
    if (event.key !== 'Tab' || navigate) {
      return
    }

    const textarea = event.currentTarget
    if (!(textarea instanceof HTMLTextAreaElement) || textarea.disabled || textarea.readOnly) {
      return
    }
    event.preventDefault()

    const edit = getIndentationEdit(
      textarea.value, textarea.selectionStart, textarea.selectionEnd, event.shiftKey,
    )
    if (!edit) {
      return
    }

    const { selectionDirection, scrollTop, scrollLeft } = textarea
    textarea.setRangeText(edit.text, edit.start, edit.end, 'end')
    textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd, selectionDirection)
    // Programmatic replacements do not emit input; notify v-model explicitly.
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.scrollTop = scrollTop
    textarea.scrollLeft = scrollLeft
  }

  return { handleEditorKeydown, resetTabNavigation }
}
