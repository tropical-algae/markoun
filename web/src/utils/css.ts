const parseCssTimeToMs = (value: string): number | null => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.endsWith('ms')) {
    const parsed = Number.parseFloat(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (trimmed.endsWith('s')) {
    const parsed = Number.parseFloat(trimmed)
    return Number.isFinite(parsed) ? parsed * 1000 : null
  }

  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export const readCssTimeMs = (name: string, fallbackMs: number): number => {
  if (typeof window === 'undefined') {
    return fallbackMs
  }

  const value = window.getComputedStyle(document.documentElement)
    .getPropertyValue(name)
  return parseCssTimeToMs(value) ?? fallbackMs
}

export const readCssNumber = (name: string, fallback: number): number => {
  if (typeof window === 'undefined') {
    return fallback
  }

  const value = window.getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const readCssLengthPx = (name: string, fallbackPx: number): number => {
  if (typeof window === 'undefined') {
    return fallbackPx
  }

  const styles = window.getComputedStyle(document.documentElement)
  const value = styles.getPropertyValue(name).trim()
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) {
    return fallbackPx
  }

  if (value.endsWith('rem')) {
    const rootFontSize = Number.parseFloat(styles.fontSize)
    return Number.isFinite(rootFontSize) ? parsed * rootFontSize : fallbackPx
  }

  return parsed
}
