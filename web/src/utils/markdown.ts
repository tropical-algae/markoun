import { Marked, Renderer } from 'marked';
import { katexExtensions } from '@/utils/katex'; 
import { getMediaPath, getParentPath } from '@/utils/file-system';

const marked = new Marked();
marked.use(katexExtensions());

export const renderMarkdownFile = (path: string, content: string): string => {
  const parentPath = getParentPath(path)
  const renderer = new Renderer()

  renderer.image = ({ href, title, text }) => {
    const mediaPath = getMediaPath(parentPath, href)
    return `<img src="${mediaPath}" title="${title || ''}" alt="${text || ''}" />`
  }

  return marked.parse(content, {
    renderer,
    async: false,
  })
}

export default marked;
