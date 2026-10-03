import assert from 'node:assert/strict'
import test from 'node:test'
import { getIndentationEdit } from '../src/utils/editor-indentation.ts'

const apply = (value: string, start: number, end = start, outdent = false) => {
  const edit = getIndentationEdit(value, start, end, outdent)
  return edit
    ? { value: value.slice(0, edit.start) + edit.text + value.slice(edit.end), start: edit.selectionStart, end: edit.selectionEnd }
    : { value, start, end }
}

test('Tab inserts four spaces at the caret without replacing surrounding text', () => {
  assert.deepEqual(apply('', 0), { value: '    ', start: 4, end: 4 })
  assert.deepEqual(apply('hello', 2), { value: 'he    llo', start: 6, end: 6 })
  assert.deepEqual(apply('hello', 5), { value: 'hello    ', start: 9, end: 9 })
})

test('Tab indents selected lines and preserves the selected text', () => {
  assert.deepEqual(apply('alpha\nbeta\ngamma', 1, 8), {
    value: '    alpha\n    beta\ngamma', start: 5, end: 16,
  })
  assert.deepEqual(apply('alpha', 1, 3), { value: '    alpha', start: 5, end: 7 })
})

test('a selection ending at the start of a line excludes that line', () => {
  assert.deepEqual(apply('alpha\nbeta', 0, 6), {
    value: '    alpha\nbeta', start: 4, end: 10,
  })
  assert.deepEqual(apply('alpha\n', 0, 6), {
    value: '    alpha\n', start: 4, end: 10,
  })
})

test('Shift+Tab removes one indentation level from the current line', () => {
  assert.deepEqual(apply('    alpha', 7, 7, true), { value: 'alpha', start: 3, end: 3 })
  assert.deepEqual(apply('        alpha', 10, 10, true), { value: '    alpha', start: 6, end: 6 })
  assert.deepEqual(apply('alpha\n    beta', 12, 12, true), { value: 'alpha\nbeta', start: 8, end: 8 })
  assert.equal(getIndentationEdit('alpha', 2, 2, true), null)
})

test('outdenting clamps a caret inside indentation instead of moving to the preceding line', () => {
  assert.deepEqual(apply('    alpha', 2, 2, true), { value: 'alpha', start: 0, end: 0 })
  assert.deepEqual(apply('alpha\n    beta', 7, 7, true), { value: 'alpha\nbeta', start: 6, end: 6 })
})

test('outdenting handles short space prefixes, tabs, and unindented lines', () => {
  const text = '  alpha\n\tbeta\ngamma'
  assert.deepEqual(apply(text, 1, text.length, true), {
    value: 'alpha\nbeta\ngamma', start: 0, end: text.length - 3,
  })
  assert.deepEqual(apply('\talpha', 1, 1, true), { value: 'alpha', start: 0, end: 0 })
})

test('empty lines and trailing newlines remain intact', () => {
  assert.deepEqual(apply('\nalpha', 0, 2), { value: '    \n    alpha', start: 4, end: 10 })
  assert.deepEqual(apply('alpha\n', 6), { value: 'alpha\n    ', start: 10, end: 10 })
  assert.deepEqual(apply('    \n', 2, 2, true), { value: '\n', start: 0, end: 0 })
  assert.equal(getIndentationEdit('\nalpha', 0, 0, true), null)
})

test('indenting and outdenting a block restores its content and selection', () => {
  const original = 'first\nsecond\nthird'
  const indented = apply(original, 1, 15)
  assert.deepEqual(apply(indented.value, indented.start, indented.end, true), {
    value: original, start: 1, end: 15,
  })
})
