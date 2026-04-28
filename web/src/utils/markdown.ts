import { Marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';
import { katexExtensions } from '@/utils/katex'; 
import { getMediaPath, getParentPath } from '@/utils/file-system';

const marked = new Marked();
marked.use(katexExtensions());

const escapeHtmlAttribute = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export const renderMarkdownFile = (path: string, content: string): string => {
  const parentPath = getParentPath(path)
  const renderer = new Renderer()

  renderer.image = ({ href, title, text }) => {
    const mediaPath = getMediaPath(parentPath, href)
    return [
      '<img',
      `src="${escapeHtmlAttribute(mediaPath)}"`,
      `title="${escapeHtmlAttribute(title || '')}"`,
      `alt="${escapeHtmlAttribute(text || '')}"`,
      '/>',
    ].join(' ')
  }

  const rawHtml = marked.parse(content, {
    renderer,
    async: false,
  })

  return DOMPurify.sanitize(rawHtml, {
    FORBID_TAGS: ['script', 'style'],
  })
}

export default marked;
