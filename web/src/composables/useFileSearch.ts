import { computed, onScopeDispose, ref, shallowRef } from 'vue'
import { searchFilesApi } from '@/api/file'
import { useToastStore } from '@/stores/toast'
import type { AsyncStatus } from '@/types/async'
import type { FileSearchResult } from '@/types/file-system'

export const useFileSearch = () => {
  const toastStore = useToastStore()
  const keyword = ref('')
  const results = shallowRef<readonly FileSearchResult[]>([])
  const status = ref<AsyncStatus>('ready')
  const hasSearched = ref(false)
  let controller: AbortController | null = null

  const normalizedKeyword = computed(() => keyword.value.trim())
  const isPending = computed(() => status.value === 'loading')
  const canSearch = computed(() => normalizedKeyword.value.length > 0 && !isPending.value)

  const submitSearch = async () => {
    if (isPending.value) {
      return
    }

    if (!canSearch.value) {
      if (keyword.value.length > 0) {
        toastStore.pushNotice('warning', 'Search keyword cannot be empty.')
      }
      return
    }

    status.value = 'loading'
    hasSearched.value = true
    const requestController = new AbortController()
    controller = requestController

    try {
      const response = await searchFilesApi(normalizedKeyword.value, {
        signal: requestController.signal,
      })
      if (requestController.signal.aborted) {
        return
      }
      results.value = response.data
      status.value = 'ready'
    } catch (_) {
      if (requestController.signal.aborted) {
        return
      }
      results.value = []
      status.value = 'error'
    } finally {
      controller = null
    }
  }

  onScopeDispose(() => controller?.abort())

  return {
    keyword,
    results,
    status,
    hasSearched,
    isPending,
    submitSearch,
  }
}
