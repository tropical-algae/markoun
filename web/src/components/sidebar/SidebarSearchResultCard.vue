<template>
  <BaseTooltip :text="result.node.path" placement="right" block>
    <article class="search-result-card">
      <button
        type="button"
        class="search-result-open"
        :aria-label="`Open ${result.node.name}`"
        @click="emit('open')"
      >
        <span class="search-result-title-row">
          <span class="search-result-title fw-bold f-s fc-pri">{{ result.node.name }}</span>
          <span class="meta-tag">{{ result.node.suffix.toUpperCase() }}</span>
        </span>
        <span class="search-result-path f-xs fc-sec">{{ result.node.path }}</span>
        <span v-if="result.matches.length" :id="matchListId" class="search-result-match-list">
          <span v-for="match in visibleMatches" :key="match.line" class="search-result-snippet f-xs fc-pri">
            <span class="search-result-line fc-sec">L{{ match.line }}</span>
            <span class="search-result-snippet-text">{{ match.snippet }}</span>
          </span>
        </span>
      </button>

      <div v-if="result.matches.length > SEARCH_MATCH_PREVIEW_COUNT" class="search-result-actions">
        <button
          type="button"
          class="search-result-action f-xs fw-bold"
          :aria-controls="matchListId"
          :aria-expanded="isExpanded"
          @click="hasMore ? showMore() : collapse()"
        >
          {{ hasMore ? `Show more (${remainingCount})` : 'Show less' }}
        </button>
        <button
          v-if="isExpanded && hasMore"
          type="button"
          class="search-result-action f-xs fw-bold"
          :aria-controls="matchListId"
          :aria-expanded="true"
          @click="collapse"
        >
          Show less
        </button>
      </div>
    </article>
  </BaseTooltip>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import BaseTooltip from '@/components/base/BaseTooltip.vue'
import { SEARCH_MATCH_BATCH_SIZE, SEARCH_MATCH_PREVIEW_COUNT } from '@/constants/search'
import type { FileSearchResult } from '@/types/file-system'

const props = defineProps<{ result: FileSearchResult }>()
const emit = defineEmits<{ (event: 'open'): void }>()
const matchListId = useId()
const visibleCount = ref(SEARCH_MATCH_PREVIEW_COUNT)
const visibleMatches = computed(() => props.result.matches.slice(0, visibleCount.value))
const remainingCount = computed(() => Math.max(0, props.result.matches.length - visibleCount.value))
const hasMore = computed(() => remainingCount.value > 0)
const isExpanded = computed(() => visibleCount.value > SEARCH_MATCH_PREVIEW_COUNT)

const showMore = () => {
  visibleCount.value = Math.min(props.result.matches.length, visibleCount.value + SEARCH_MATCH_BATCH_SIZE)
}
const collapse = () => { visibleCount.value = SEARCH_MATCH_PREVIEW_COUNT }
watch(() => props.result, collapse)
</script>

<style scoped>
.search-result-card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-pri);
  box-shadow: inset 0 0 0 var(--line-width) var(--color-line);
  transition:
    background-color var(--motion-soft-duration) ease,
    box-shadow var(--motion-soft-duration) ease;
}

.search-result-card:focus-within {
  background-color: var(--color-action-light);
  box-shadow: inset 0 0 0 var(--line-width) var(--color-action);
}

.search-result-open {
  display: flex;
  flex-direction: column;
  gap: var(--space-compact);
  width: 100%;
  min-width: 0;
  padding: var(--space-md);
  box-sizing: border-box;
  text-align: left;
  cursor: pointer;
}

.search-result-open:focus-visible {
  outline: none;
}

.search-result-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-compact);
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.search-result-title {
  display: block;
  width: 0;
  max-width: 100%;
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-result-title-row .meta-tag {
  flex-shrink: 0;
}

.search-result-path {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-result-match-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-compact);
  width: 100%;
  min-width: 0;
}

.search-result-snippet {
  display: grid;
  grid-template-columns: var(--search-result-line-width) minmax(0, 1fr);
  min-width: 0;
  gap: var(--space-compact);
  line-height: var(--search-result-snippet-line-height);
  white-space: normal;
  overflow-wrap: anywhere;
}

.search-result-snippet-text {
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.search-result-line {
  white-space: nowrap;
}

.search-result-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: 0 var(--space-md) var(--space-md);
}

.search-result-action {
  color: var(--color-action);
  padding-block: var(--space-xs);
  text-align: left;
  cursor: pointer;
}

.search-result-action:focus-visible {
  outline: var(--line-width) solid var(--color-action);
  outline-offset: var(--space-2xs);
}

@media (hover: hover) {
  .search-result-card:hover {
    background-color: var(--color-action-light);
    box-shadow: inset 0 0 0 var(--line-width) var(--color-action);
  }

  .search-result-action:hover {
    text-decoration: underline;
  }
}
</style>
