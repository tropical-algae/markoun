const readRootCssVar = (name: string): string => {
  if (typeof window === 'undefined') {
    return ''
  }

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export const readRootCssNumber = (name: string, fallback: number): number => {
  const rawValue = readRootCssVar(name)
  const parsedValue = Number.parseFloat(rawValue)
  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

