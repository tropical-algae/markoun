import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  DEFAULT_SHOW_TOOLTIPS,
  DEFAULT_THEME_MODE,
  THEME_OPTIONS,
  type ThemeMode,
} from '@/constants/appearance'

const THEME_STORAGE_KEY = 'markoun.theme'
const TOOLTIP_STORAGE_KEY = 'markoun.showTooltips'
const LEGACY_THEME_COLOR_STORAGE_KEY = 'markoun.themeColor'

const isThemeMode = (value: string | null): value is ThemeMode => {
  return THEME_OPTIONS.some((option) => option.id === value)
}

const parseStoredBoolean = (value: string | null, fallback: boolean) => {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return fallback
}

const applyTheme = (themeMode: ThemeMode) => {
  document.documentElement.dataset.theme = themeMode
  delete document.documentElement.dataset.themeColor
}

export const useAppearanceStore = defineStore('appearance', () => {
  const currentTheme = ref<ThemeMode>(DEFAULT_THEME_MODE)
  const showTooltips = ref(DEFAULT_SHOW_TOOLTIPS)

  const initAppearance = () => {
    if (typeof window === 'undefined') {
      return
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    currentTheme.value = isThemeMode(storedTheme) ? storedTheme : DEFAULT_THEME_MODE
    applyTheme(currentTheme.value)

    showTooltips.value = parseStoredBoolean(
      window.localStorage.getItem(TOOLTIP_STORAGE_KEY),
      DEFAULT_SHOW_TOOLTIPS,
    )

    window.localStorage.removeItem(LEGACY_THEME_COLOR_STORAGE_KEY)
  }

  const setTheme = (themeMode: ThemeMode) => {
    currentTheme.value = themeMode
    applyTheme(themeMode)
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }

  const setShowTooltips = (isEnabled: boolean) => {
    showTooltips.value = isEnabled
    window.localStorage.setItem(TOOLTIP_STORAGE_KEY, String(isEnabled))
  }

  return {
    currentTheme,
    showTooltips,
    themeOptions: THEME_OPTIONS,
    initAppearance,
    setTheme,
    setShowTooltips,
  }
})
