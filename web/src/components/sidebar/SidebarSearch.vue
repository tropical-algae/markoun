<template>
  <SidebarPanelLayout class="search-sidebar" title="Search">
    <form class="search-form" @submit.prevent="submitSearch">
      <UnderlinedInput
        v-model="keyword"
        class="f-s"
        label="Keyword"
        name="keyword"
        autocomplete="off"
        placeholder="Search markdown files..."
        :readonly="isPending"
      />

      <button type="submit" class="icon-btn" aria-label="Search notes" :disabled="isPending">
        <component :is="SearchIcon"></component>
      </button>
    </form>

    <div ref="resultsBody" class="sidebar-panel-body touch-scroll" :aria-busy="isPending">
      <SidebarSearchResults
        :status="status"
        :has-searched="hasSearched"
        :results="pageItems"
        @open="openSearchResult"
      />
    </div>

    <template #footer>
      <div class="search-footer sidebar-panel-footer horizontal-line-top">
        <div class="search-summary f-xs fc-sec" role="status" aria-live="polite" aria-atomic="true">
          <template v-if="isPending">Searching...</template>
          <template v-else-if="status === 'error'">Search unavailable</template>
          <template v-else-if="!hasSearched">Search by filename or content</template>
          <template v-else-if="total === 0">No matching files</template>
          <template v-else>{{ firstItem }}-{{ lastItem }} of {{ total }} files</template>
        </div>
        <BasePagination
          :page="page"
          :page-count="pageCount"
          :disabled="isPending"
          @update:page="setPage"
        />
      </div>
    </template>
  </SidebarPanelLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useNodeStore } from '@/stores/note'
import type { FileSearchResult } from '@/types/file-system'
import { useFileSearch } from '@/composables/useFileSearch'
import { usePagination } from '@/composables/usePagination'
import { SEARCH_FILES_PER_PAGE } from '@/constants/search'

import BasePagination from '@/components/base/BasePagination.vue'
import SidebarSearchResults from '@/components/sidebar/SidebarSearchResults.vue'
import UnderlinedInput from '@/components/base/UnderlinedInput.vue'
import SidebarPanelLayout from '@/layouts/SidebarPanelLayout.vue'
import SearchIcon from '@/assets/icons/search.svg'

const emit = defineEmits<{
  (event: 'nodeOpened'): void
}>()

const nodeStore = useNodeStore()
const { keyword, results, status, hasSearched, isPending, submitSearch } = useFileSearch()
const { page, pageCount, pageItems, total, firstItem, lastItem, setPage } = usePagination(
  results, SEARCH_FILES_PER_PAGE,
)
const resultsBody = ref<HTMLElement | null>(null)

watch([page, results], () => {
  if (resultsBody.value) {
    resultsBody.value.scrollTop = 0
  }
}, { flush: 'post' })

const openSearchResult = async (result: FileSearchResult) => {
  await nodeStore.setCurrentNode(result.node)
  emit('nodeOpened')
}
</script>

<style scoped>
.search-sidebar {
  min-height: 0;
}

.search-form {
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  align-items: flex-end;
  gap: var(--space-xs);
  margin-bottom: var(--space-lg);
}

.search-form :deep(.underlined-input-wrapper) {
  flex: 1 1 auto;
  min-width: 0;
}

.search-form .icon-btn:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}

.search-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.search-summary {
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}
</style>
