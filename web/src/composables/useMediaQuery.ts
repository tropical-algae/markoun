import { onBeforeUnmount, ref } from 'vue'

export const useMediaQuery = (query: string) => {
  const matches = ref(false)

  if (typeof window === 'undefined') {
    return matches
  }

  const mediaQuery = window.matchMedia(query)
  const syncMatches = () => {
    matches.value = mediaQuery.matches
  }
  const addListener = () => {
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMatches)
      return
    }

    mediaQuery.addListener(syncMatches)
  }
  const removeListener = () => {
    if (typeof mediaQuery.removeEventListener === 'function') {
      mediaQuery.removeEventListener('change', syncMatches)
      return
    }

    mediaQuery.removeListener(syncMatches)
  }

  syncMatches()
  addListener()

  onBeforeUnmount(() => {
    removeListener()
  })

  return matches
}
