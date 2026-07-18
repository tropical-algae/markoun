import { computed, ref } from 'vue'
import { searchFileContentApi } from '@/api/file'
import { DEFAULT_SEARCH_RESULT_LIMIT } from '@/constants/search'
import { useToastStore } from '@/stores/toast'
import type { AsyncStatus } from '@/types/async'
import type { FileSearchResult } from '@/types/file-system'

export const useFileContentSearch = () => {
  const toastStore = useToastStore()
  const keyword = ref('')
  const results = ref<FileSearchResult[]>([])
  const status = ref<AsyncStatus>('ready')
  const hasSearched = ref(false)

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

    try {
      const response = await searchFileContentApi(
        normalizedKeyword.value,
        DEFAULT_SEARCH_RESULT_LIMIT,
      )
      results.value = response.data
      status.value = 'ready'
    } catch (_) {
      results.value = []
      status.value = 'error'
    }
  }

  return {
    keyword,
    results,
    status,
    hasSearched,
    submitSearch,
  }
}
