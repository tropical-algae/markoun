<template>
  <AsyncGate
    :status="status"
    :is-empty="hasSearched && results.length === 0"
    tag="div"
    class="search-body touch-scroll"
  >
    <template #loading>
      <div class="search-skeleton-list">
        <div v-for="index in 4" :key="index" class="search-result-card">
          <BaseSkeleton
            width="var(--search-skeleton-title-width)"
            height="var(--search-skeleton-title-height)"
          />
          <BaseSkeleton height="var(--search-skeleton-line-height)" />
          <BaseSkeleton
            :width="index % 2 === 0
              ? 'var(--search-skeleton-line-long-width)'
              : 'var(--search-skeleton-line-short-width)'"
            height="var(--search-skeleton-line-height)"
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
      <BaseTooltip
        v-for="result in results"
        :key="result.node.path"
        :text="result.node.path"
        placement="right"
        block
      >
        <button
          class="search-result-card"
          type="button"
          @click="emit('open', result)"
        >
          <div class="search-result-title-row">
            <span class="search-result-title fw-bold f-s fc-pri">
              {{ result.node.name }}
            </span>
            <span class="meta-tag">{{ result.node.suffix.toUpperCase() }}</span>
          </div>

          <div class="search-result-path f-xs fc-sec">
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
</template>

<script setup lang="ts">
import type { AsyncStatus } from '@/types/async'
import type { FileSearchResult } from '@/types/file-system'
import AsyncGate from '@/components/base/AsyncGate.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import BaseTooltip from '@/components/base/BaseTooltip.vue'

defineProps<{
  status: AsyncStatus
  hasSearched: boolean
  results: FileSearchResult[]
}>()

const emit = defineEmits<{
  (event: 'open', result: FileSearchResult): void
}>()
</script>

<style scoped>
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-result-path {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
