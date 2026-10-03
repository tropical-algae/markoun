import assert from 'node:assert/strict'
import test from 'node:test'
import { fileRouteHref, normalizeFilePath, resolveMarkdownLink } from '../src/utils/file-navigation.ts'

test('workspace paths normalize segments without permitting traversal outside the root', () => {
  assert.equal(normalizeFilePath('./notes/../notes/test.md'), 'notes/test.md')
  for (const path of ['../test.md', '/test.md', 'a/../../test.md', 'test.png', '', 'a\\b.md', 'a\0.md']) {
    assert.throws(() => normalizeFilePath(path))
  }
})

test('file URLs encode each segment exactly once, including literal percent signs', () => {
  assert.equal(fileRouteHref('notes/中文 # 100%.md'), '/file/notes/%E4%B8%AD%E6%96%87%20%23%20100%25.md')
  assert.equal(fileRouteHref('login/file.md'), '/file/login/file.md')
  assert.equal(fileRouteHref('literal%20name.md'), '/file/literal%2520name.md')
})

test('Markdown references resolve against the note, not the current browser route', () => {
  for (const [input, output] of [
    ['other.md', '/file/aaa/other.md'],
    ['ccc/ddd.md', '/file/aaa/ccc/ddd.md'],
    ['../ccc/ddd.md', '/file/ccc/ddd.md'],
    ['/ccc/ddd.md', '/file/ccc/ddd.md'],
    ['other.md?mode=read#section', '/file/aaa/other.md?mode=read#section'],
    ['My%20Note.md', '/file/aaa/My%20Note.md'],
    ['100%.md', '/file/aaa/100%25.md'],
  ]) {
    assert.equal(resolveMarkdownLink('aaa/bbb.md', input!), output)
  }
  assert.equal(resolveMarkdownLink('', 'hello.md'), '/file/hello.md')
  assert.equal(resolveMarkdownLink('a #/b.md', 'next.md'), '/file/a%20%23/next.md')
})

test('external links, anchors and attachments retain their original destinations', () => {
  for (const href of ['https://example.com/a.md', '//example.com/a.md', 'mailto:a@example.com',
    '#section', '?page=1', 'image.png', 'files.zip', 'plain-text']) {
    assert.equal(resolveMarkdownLink('a/b.md', href), href)
  }
})

test('application URLs are preserved while a directory named file remains addressable', () => {
  const href = '/file/notes/My%20Note.md?view=read#section'
  assert.equal(resolveMarkdownLink('notes/a.md', href), href)
  assert.equal(resolveMarkdownLink('a.md', 'file/b.md'), '/file/file/b.md')
  assert.equal(resolveMarkdownLink('a.md', './file/b.md'), '/file/file/b.md')
  const resolved = resolveMarkdownLink('notes/a.md', '../b.md')
  assert.equal(resolveMarkdownLink('notes/a.md', resolved), resolved)
})
