import { onScopeDispose, readonly, ref, type Ref } from 'vue'

interface MediaQueryEntry {
  matches: Ref<boolean>
  mediaQuery: MediaQueryList
  consumers: number
  sync: () => void
}

const mediaQueries = new Map<string, MediaQueryEntry>()

const addChangeListener = (entry: MediaQueryEntry) => {
  if (typeof entry.mediaQuery.addEventListener === 'function') {
    entry.mediaQuery.addEventListener('change', entry.sync)
    return
  }

  entry.mediaQuery.addListener(entry.sync)
}

const removeChangeListener = (entry: MediaQueryEntry) => {
  if (typeof entry.mediaQuery.removeEventListener === 'function') {
    entry.mediaQuery.removeEventListener('change', entry.sync)
    return
  }

  entry.mediaQuery.removeListener(entry.sync)
}

const createMediaQueryEntry = (query: string): MediaQueryEntry => {
  const mediaQuery = window.matchMedia(query)
  const matches = ref(mediaQuery.matches)
  const entry: MediaQueryEntry = {
    matches,
    mediaQuery,
    consumers: 0,
    sync: () => {
      matches.value = mediaQuery.matches
    },
  }

  addChangeListener(entry)
  return entry
}

export const useMediaQuery = (query: string) => {
  if (typeof window === 'undefined') {
    return readonly(ref(false))
  }

  const entry = mediaQueries.get(query) ?? createMediaQueryEntry(query)
  mediaQueries.set(query, entry)
  entry.consumers += 1

  onScopeDispose(() => {
    entry.consumers -= 1
    if (entry.consumers > 0) {
      return
    }

    removeChangeListener(entry)
    mediaQueries.delete(query)
  })

  return readonly(entry.matches)
}
