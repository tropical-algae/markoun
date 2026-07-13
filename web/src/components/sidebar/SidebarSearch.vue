<template>
  <div class="search-sidebar d-flex flex-column h-100">
    <BaseHeader>
      <div class="f-m fw-bold text-uppercase">Search</div>
    </BaseHeader>

    <form class="search-form py-3 d-flex flex-row align-items-end flex-shrink-0 gap-1" @submit.prevent="submitSearch">
      <UnderlinedInput
        v-model="keyword"
        class="f-s"
        label="Keyword"
        placeholder="Search markdown files..."
        :disabled="searchStatus === 'loading'"
      />

      <button type="submit">
        <component :is="SearchIcon" class="icon-btn"></component>
      </button>
    </form>

    <AsyncGate
      :status="searchStatus"
      :is-empty="hasSearched && results.length === 0"
      tag="div"
      class="search-body touch-scroll"
    >
      <template #loading>
        <div class="search-skeleton-list">
          <div v-for="index in 4" :key="index" class="search-result-card">
            <BaseSkeleton width="58%" height="0.85rem" />
            <BaseSkeleton height="0.75rem" />
            <BaseSkeleton :width="index % 2 === 0 ? '72%' : '46%'" height="0.75rem" />
          </div>
        </div>
      </template>

      <template #empty>
        <div class="search-empty-state f-s fc-sec">
          No markdown files matched this keyword.
        </div>
      </template>

      <template #error>
        <div class="search-empty-state f-s fc-sec">
          Search failed. Try again later.
        </div>
      </template>

      <div v-if="hasSearched" class="search-result-list">
        <BaseTooltip
          v-for="result in results"
          :key="result.node.path"
          :text="result.node.path"
          :placement="resultTooltipPlacement"
          block
        >
          <button
            class="search-result-card"
            type="button"
            @click="openSearchResult(result)"
          >
            <div class="search-result-title-row">
              <span class="search-result-title text-truncate fw-bold f-s fc-pri">
                {{ result.node.name }}
              </span>
              <span class="meta-tag">{{ result.node.suffix.toUpperCase() }}</span>
            </div>

            <div class="search-result-path text-truncate f-xs fc-sec">
              {{ result.node.path }}
            </div>

            <div class="search-result-match-list">
              <div
                v-for="match in result.matches"
                :key="`${result.node.path}:${match.line}:${match.snippet}`"
                class="search-result-snippet f-xs fc-pri"
              >
                <span class="search-result-line fc-sec">L{{ match.line }}</span>
                <span>{{ match.snippet }}</span>
              </div>
            </div>
          </button>
        </BaseTooltip>

      </div>

      <div v-else class="search-empty-state f-s fc-sec">
        Enter a keyword to search across markdown files.
      </div>
    </AsyncGate>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { searchFileContentApi } from '@/api/file'
import { COMPACT_LAYOUT_MEDIA_QUERY } from '@/constants/layout'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useNodeStore } from '@/stores/note'
import { useToastStore } from '@/stores/toast'
import type { AsyncStatus } from '@/types/async'
import type { FileSearchResult } from '@/types/file-system'

import AsyncGate from '@/components/base/AsyncGate.vue'
import BaseHeader from '@/components/base/BaseHeader.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import SearchIcon from "@/assets/icons/search.svg"

import BaseTooltip from '@/components/base/BaseTooltip.vue';
import UnderlinedInput from '@/components/base/UnderlinedInput.vue'

const DEFAULT_SEARCH_LIMIT = 50
const emit = defineEmits<{
  (event: 'nodeOpened'): void
}>()

const keyword = ref('')
const results = ref<FileSearchResult[]>([])
const searchStatus = ref<AsyncStatus>('ready')
const hasSearched = ref(false)

const nodeStore = useNodeStore()
const toastStore = useToastStore()
const isCompactLayout = useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY)
const resultTooltipPlacement = computed(() => isCompactLayout.value ? 'bottom' : 'right')

const normalizedKeyword = computed(() => keyword.value.trim())
const canSearch = computed(() => {
  return normalizedKeyword.value.length > 0 && searchStatus.value !== 'loading'
})

const submitSearch = async () => {
  if (!canSearch.value) {
    if (keyword.value.length > 0) {
      toastStore.pushNotice('warning', 'Search keyword cannot be empty.')
    }
    return
  }

  searchStatus.value = 'loading'
  hasSearched.value = true

  try {
    const response = await searchFileContentApi(normalizedKeyword.value, DEFAULT_SEARCH_LIMIT)
    results.value = response.data
    searchStatus.value = 'ready'
  } catch (_) {
    results.value = []
    searchStatus.value = 'error'
  }
}

const openSearchResult = async (result: FileSearchResult) => {
  await nodeStore.setCurrentNode(result.node)
  emit('nodeOpened')
}
</script>

<style scoped>
.search-sidebar {
  min-height: 0;
}

.search-body {
  min-height: 0;
  flex: 1;
  overflow-y: scroll;
}

.search-result-list,
.search-skeleton-list {
  display: flex;
  flex-direction: column;
  gap: var(--search-result-gap);
  padding-bottom: var(--settings-skeleton-padding-bottom);
}

.search-skeleton-list {
  gap: var(--search-skeleton-gap);
}

.search-result-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--hint-gap);
  padding: var(--search-result-padding);
  border: var(--search-result-border-width) solid var(--color-line);
  border-radius: var(--search-result-radius);
  background-color: var(--color-bg-pri);
  text-align: left;
  transition:
    background-color var(--motion-soft-duration) ease,
    border-color var(--motion-soft-duration) ease,
    transform var(--motion-soft-duration) ease;
}

button.search-result-card:focus-visible {
  border-color: var(--color-action);
  background-color: var(--color-action-light);
}

@media (hover: hover) {
  button.search-result-card:hover {
    border-color: var(--color-action);
    background-color: var(--color-action-light);
  }
}

.search-result-title-row {
  display: flex;
  align-items: center;
  gap: var(--hint-gap);
  min-width: 0;
}

.search-result-title {
  min-width: 0;
}

.search-result-path {
  min-width: 0;
}

.search-result-match-list {
  display: flex;
  flex-direction: column;
  gap: var(--hint-gap);
}

.search-result-snippet {
  display: grid;
  grid-template-columns: var(--search-result-line-width) minmax(0, 1fr);
  gap: var(--hint-gap);
  line-height: var(--search-result-snippet-line-height);
  white-space: normal;
  overflow-wrap: anywhere;
}

.search-result-line {
  white-space: nowrap;
}

.search-empty-state {
  padding: var(--search-empty-padding) 0;
  white-space: normal;
  text-align: center;
}
</style>
