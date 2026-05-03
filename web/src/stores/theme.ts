import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  DEFAULT_THEME_MODE,
  THEME_OPTIONS,
  type ThemeMode,
} from '@/constants/theme'

const THEME_STORAGE_KEY = 'markoun.theme'
const LEGACY_THEME_COLOR_STORAGE_KEY = 'markoun.themeColor'

const isThemeMode = (value: string | null): value is ThemeMode => {
  return THEME_OPTIONS.some((option) => option.id === value)
}

const applyTheme = (themeMode: ThemeMode) => {
  document.documentElement.dataset.theme = themeMode
  delete document.documentElement.dataset.themeColor
}

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeMode>(DEFAULT_THEME_MODE)

  const initTheme = () => {
    if (typeof window === 'undefined') {
      return
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    currentTheme.value = isThemeMode(storedTheme) ? storedTheme : DEFAULT_THEME_MODE
    applyTheme(currentTheme.value)
    window.localStorage.removeItem(LEGACY_THEME_COLOR_STORAGE_KEY)
  }

  const setTheme = (themeMode: ThemeMode) => {
    currentTheme.value = themeMode
    applyTheme(themeMode)
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }

  return {
    currentTheme,
    themeOptions: THEME_OPTIONS,
    initTheme,
    setTheme,
  }
})
