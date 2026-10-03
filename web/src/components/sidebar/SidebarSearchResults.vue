<template>
  <AsyncGate
    :status="status"
    :is-empty="hasSearched && results.length === 0"
    :show-delay-ms="searchAsyncGateDelayMs"
    tag="div"
    class="search-state"
  >
    <template #loading>
      <div class="search-skeleton-list">
        <div v-for="index in 4" :key="index" class="search-skeleton-card">
          <BaseSkeleton
            width="var(--skeleton-width-md)"
            height="var(--skeleton-text-height-sm)"
          />
          <BaseSkeleton height="var(--skeleton-text-height-xs)" />
          <BaseSkeleton
            :width="index % 2 === 0
              ? 'var(--skeleton-width-lg)'
              : 'var(--skeleton-width-sm)'"
            height="var(--skeleton-text-height-xs)"
          />
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
      <SidebarSearchResultCard
        v-for="result in results"
        :key="result.node.path"
        :result="result"
        @open="emit('open', result)"
      />
    </div>

    <div v-else class="search-empty-state f-s fc-sec">
      Enter a keyword to search across markdown files.
    </div>
  </AsyncGate>
</template>

<script setup lang="ts">
import type { AsyncStatus } from '@/types/async'
import type { FileSearchResult } from '@/types/file-system'
import { readCssTimeMs } from '@/utils/css'
import AsyncGate from '@/components/base/AsyncGate.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import SidebarSearchResultCard from '@/components/sidebar/SidebarSearchResultCard.vue'

defineProps<{
  status: AsyncStatus
  hasSearched: boolean
  results: readonly FileSearchResult[]
}>()

const searchAsyncGateDelayMs = readCssTimeMs('--search-async-gate-delay-ms', 0)

const emit = defineEmits<{
  (event: 'open', result: FileSearchResult): void
}>()
</script>

<style scoped>
.search-state {
  width: 100%;
  min-width: 0;
}

.search-result-list,
.search-skeleton-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  gap: var(--space-sm);
  padding-bottom: var(--space-lg);
  box-sizing: border-box;
}

.search-skeleton-list {
  gap: var(--space-md);
}

.search-skeleton-card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-compact);
  padding: var(--space-md);
  overflow: hidden;
  box-sizing: border-box;
  border: 0;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-pri);
  box-shadow: inset 0 0 0 var(--line-width) var(--color-line);
}

.search-empty-state {
  padding: var(--space-xl) 0;
  white-space: normal;
  text-align: center;
}
</style>
