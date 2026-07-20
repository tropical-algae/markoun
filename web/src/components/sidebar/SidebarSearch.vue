<template>
  <SidebarPanelLayout class="search-sidebar" title="Search">
    <form class="search-form" @submit.prevent="submitSearch">
      <UnderlinedInput
        v-model="keyword"
        class="f-s"
        label="Keyword"
        placeholder="Search markdown files..."
        :readonly="status === 'loading'"
      />

      <button type="submit" class="icon-btn">
        <component :is="SearchIcon"></component>
      </button>
    </form>

    <SidebarSearchResults
      :status="status"
      :has-searched="hasSearched"
      :results="results"
      @open="openSearchResult"
    />
  </SidebarPanelLayout>
</template>

<script setup lang="ts">
import { useNodeStore } from '@/stores/note'
import type { FileSearchResult } from '@/types/file-system'
import { useFileContentSearch } from '@/composables/useFileContentSearch'

import SidebarSearchResults from '@/components/sidebar/SidebarSearchResults.vue'
import UnderlinedInput from '@/components/base/UnderlinedInput.vue'
import SidebarPanelLayout from '@/layouts/SidebarPanelLayout.vue'
import SearchIcon from '@/assets/icons/search.svg'

const emit = defineEmits<{
  (event: 'nodeOpened'): void
}>()

const nodeStore = useNodeStore()
const { keyword, results, status, hasSearched, submitSearch } = useFileContentSearch()

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
  gap: var(--sidebar-form-gap);
  margin-bottom: var(--sidebar-form-margin-bottom);
}
</style>
