export const THEME_OPTIONS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
] as const

export type ThemeMode = typeof THEME_OPTIONS[number]['id']

export const DEFAULT_THEME_MODE: ThemeMode = 'light'
export const DEFAULT_SHOW_TOOLTIPS = true
