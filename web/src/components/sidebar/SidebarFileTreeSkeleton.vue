<template>
  <div
    class="file-tree-skeleton-list"
    :class="{ 'is-root': !isNested }"
  >
    <div
      v-for="index in rows"
      :key="index"
      class="file-tree-skeleton-row"
      :class="{ 'is-nested': isNested }"
      :style="rowStyle"
    >
      <span v-if="isNested" class="file-tree-skeleton-spacer"></span>
      <BaseSkeleton
        class="file-tree-skeleton-icon"
        width="auto"
        height="var(--tree-skeleton-icon-size)"
        radius="var(--tree-skeleton-icon-radius)"
      />
      <BaseSkeleton
        class="file-tree-skeleton-text"
        :width="resolveTextWidth(index)"
        height="var(--tree-skeleton-text-height)"
        radius="var(--tree-skeleton-text-radius)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'

const props = withDefaults(defineProps<{
  rows?: number
  depth?: number
}>(), {
  rows: 1,
})

const isNested = computed(() => props.depth !== undefined)
const rowStyle = computed(() => {
  return isNested.value ? { '--tree-depth': props.depth } : undefined
})

const resolveTextWidth = (index: number) => {
  if (isNested.value) {
    return 'var(--tree-skeleton-text-width)'
  }

  return index % 2 === 0
    ? 'var(--tree-skeleton-text-long-width)'
    : 'var(--tree-skeleton-text-short-width)'
}
</script>

<style scoped>
.file-tree-skeleton-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  gap: var(--tree-skeleton-gap);
  box-sizing: border-box;
}

.file-tree-skeleton-list.is-root {
  padding-block: var(--sidebar-toolbar-padding-y);
}

.file-tree-skeleton-row {
  display: flex;
  align-items: center;
  gap: var(--tree-skeleton-row-gap);
  padding: var(--tree-row-padding);
  box-sizing: border-box;
  min-width: 0;
}

.file-tree-skeleton-icon {
  aspect-ratio: 1;
  flex: 0 0 auto;
}

.file-tree-skeleton-row.is-nested {
  gap: var(--hint-gap);
  min-height: var(--tree-node-row-height);
  padding-left: calc(
    var(--tree-depth) * var(--tree-indent-step) +
    var(--tree-row-padding-x)
  );
}

.file-tree-skeleton-spacer {
  height: var(--tree-icon-size);
  flex-shrink: 0;
}

.file-tree-skeleton-row.is-nested .file-tree-skeleton-text {
  max-width: var(--tree-rename-max-width);
}
</style>
