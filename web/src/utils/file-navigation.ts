export const FILE_ROUTE_PREFIX = '/file/'

/** Workspace paths are decoded file identities, not browser URLs. */
export const normalizeFilePath = (path: string): string => {
  if (path.startsWith('/') || /[\\\0]/.test(path)) {
    throw new Error('Invalid file path')
  }
  const parts: string[] = []
  for (const part of path.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') {
      if (!parts.length) throw new Error('Invalid file path')
      parts.pop()
    } else {
      parts.push(part)
    }
  }
  const result = parts.join('/')
  if (!result || !/\.md$/i.test(result)) throw new Error('Invalid Markdown file path')
  return result
}

export const fileRouteLocation = (path: string) => ({
  name: 'WorkspaceFile',
  params: { path: normalizeFilePath(path).split('/') },
})

export const fileRouteHref = (path: string): string => {
  return FILE_ROUTE_PREFIX + normalizeFilePath(path).split('/').map(encodeURIComponent).join('/')
}

export const resolveMarkdownLink = (notePath: string, href: string): string => {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(href)) return href
  // Root-relative application URLs are already resolved; `file/...` remains a file path.
  if (href.startsWith(FILE_ROUTE_PREFIX)) return href
  try {
    const basePath = notePath.split('/').map(encodeURIComponent).join('/')
    const url = new URL(href, `https://workspace.invalid/${basePath}`)
    const path = url.pathname.slice(1).split('/').map((part) => {
      try { return decodeURIComponent(part) } catch { return part }
    }).join('/')
    if (!/\.md$/i.test(path)) return href
    return fileRouteHref(path) + url.search + url.hash
  } catch {
    return href
  }
}
