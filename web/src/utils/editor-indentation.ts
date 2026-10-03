const INDENT = '    '

export interface IndentationEdit {
  start: number
  end: number
  text: string
  selectionStart: number
  selectionEnd: number
}

export const getIndentationEdit = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  outdent: boolean,
): IndentationEdit | null => {
  if (!outdent && selectionStart === selectionEnd) {
    return {
      start: selectionStart,
      end: selectionEnd,
      text: INDENT,
      selectionStart: selectionStart + INDENT.length,
      selectionEnd: selectionEnd + INDENT.length,
    }
  }

  const start = selectionStart === 0 ? 0 : value.lastIndexOf('\n', selectionStart - 1) + 1
  // A selection ending at the next line's start does not include that line.
  const lastPosition = selectionEnd > selectionStart && value[selectionEnd - 1] === '\n'
    ? selectionEnd - 1
    : selectionEnd
  const nextNewline = value.indexOf('\n', lastPosition)
  const end = nextNewline === -1 ? value.length : nextNewline
  const block = value.slice(start, end)
  let lineStart = start
  let nextStart = selectionStart
  let nextEnd = selectionEnd

  const text = block.split('\n').map((line) => {
    const removed = outdent
      ? (line.startsWith('\t') ? 1 : Math.min(line.match(/^ */)?.[0].length ?? 0, INDENT.length))
      : 0
    const prefix = outdent ? '' : INDENT

    if (selectionStart >= lineStart) {
      nextStart += prefix.length - Math.min(removed, selectionStart - lineStart)
    }
    if (selectionEnd >= lineStart) {
      nextEnd += prefix.length - Math.min(removed, selectionEnd - lineStart)
    }
    lineStart += line.length + 1
    return prefix + line.slice(removed)
  }).join('\n')

  if (text === block) {
    return null
  }

  return { start, end, text, selectionStart: nextStart, selectionEnd: nextEnd }
}
