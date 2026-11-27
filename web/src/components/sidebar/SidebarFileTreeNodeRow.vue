<template>
  <div
    class="node-wrapper"
    :style="nodeIndentStyle"
    :data-tree-drop-path="dropPath"
  >
    <div
      class="node-content"
      :class="{
        'is-selected': selected,
        'is-dragover': dragOver,
        'is-node-dragging': dragging,
      }"
      draggable="true"
      tabindex="0"
      aria-haspopup="menu"
      @click="emit('clickNode')"
      @keydown.enter.self.prevent="emit('clickNode')"
      @dragstart.stop="emit('dragStart', $event)"
      @dragend="emit('dragEnd', $event)"
    >
      <button
        type="button"
        v-if="isDirectory"
        class="node-toggle-btn"
        :class="{ 'is-opened': opened, 'is-disabled': !canExpand }"
        :aria-label="`Select ${name}`"
        @click.stop="emit('clickDirectoryIcon')"
      >
        <component
          :is="icon"
          class="node-icon dir-icon"
        ></component>
      </button>
      <span v-else class="node-leading-spacer"></span>

      <div class="node-text-wrapper">
        <div class="node-text-slot">
          <span :class="{ 'file-name': !isDirectory, 'dir-name': isDirectory }">
            {{ name }}
          </span>
        </div>
      </div>

      <span v-if="suffix" class="meta-tag">{{ suffix }}</span>
    </div>

    <button
      v-if="hasTouchPointer"
      type="button"
      class="icon-btn node-menu-button"
      aria-haspopup="menu"
      :aria-label="`More actions for ${suffix ? `${name}.${suffix}` : name}`"
      data-tree-menu-button
    >
      <EllipsisIcon aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import EllipsisIcon from '@/assets/icons/ellipsis.svg'
import { useMediaQuery } from '@/composables/useMediaQuery'

const props = defineProps<{
  depth: number
  name: string
  suffix?: string
  icon: Component
  isDirectory: boolean
  selected: boolean
  opened: boolean
  canExpand: boolean
  dropPath?: string
  dragOver: boolean
  dragging: boolean
}>()

const emit = defineEmits<{
  (event: 'clickNode'): void
  (event: 'clickDirectoryIcon'): void
  (event: 'dragStart', value: DragEvent): void
  (event: 'dragEnd', value: DragEvent): void
}>()

const nodeIndentStyle = computed(() => ({
  '--tree-depth': props.depth,
}))
const hasTouchPointer = useMediaQuery('(any-pointer: coarse)')
</script>

<style scoped>
.node-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-pri);
  width: 100%;
  box-sizing: border-box;
  padding-left: calc(var(--tree-depth) * var(--tree-indent-step));
}

.node-content {
  position: relative;
  padding: var(--tree-row-padding);
  cursor: pointer;
  border-radius: var(--radius-sm);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--space-compact);
  flex: 1;
  min-width: 0;
  background-color: transparent;
  isolation: isolate;
  -webkit-tap-highlight-color: transparent;
}

.node-menu-button {
  cursor: pointer;
  fill: var(--color-text-sec);
}

.node-content:focus-visible {
  outline: var(--line-width) solid var(--color-action);
  outline-offset: calc(-1 * var(--line-width));
}

.node-content::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background-color: var(--color-bg-selected);
  content: "";
  opacity: 0;
  pointer-events: none;
  transition:
    opacity var(--motion-soft-duration) ease,
    background-color var(--motion-soft-duration) ease;
}

.node-content::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  border: var(--line-width) solid transparent;
  border-radius: inherit;
  box-sizing: border-box;
  content: "";
  pointer-events: none;
}

.node-text-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: stretch;
}

.node-text-slot {
  width: 100%;
  min-width: 0;
  padding: var(--tree-node-text-slot-padding-y) 0;
  min-height: var(--tree-node-text-height);
}

.dir-icon {
  transition: fill var(--motion-soft-duration) ease;
}

.node-toggle-btn,
.node-leading-spacer {
  height: var(--tree-icon-size);
  flex-shrink: 0;
}

.node-toggle-btn {
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
}

.node-toggle-btn.is-disabled {
  cursor: default;
}

.node-text-wrapper .file-name,
.node-text-wrapper .dir-name {
  padding: var(--tree-node-text-padding-y) var(--tree-node-text-padding-x);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  max-width: 100%;
  min-height: var(--tree-node-text-height);
  display: block;
  box-sizing: border-box;
  line-height: var(--tree-node-text-line-height);
  touch-action: manipulation;
}

.node-text-wrapper .file-name {
  color: var(--color-text-sec);
  transition: color var(--motion-soft-duration) ease;
}

.node-content.is-selected .node-text-wrapper span {
  color: var(--color-text-pri);
}

.dir-icon {
  fill: var(--color-text-pri);
}

.node-content.is-selected .dir-icon {
  fill: var(--color-action);
}

.node-content.is-selected::before {
  opacity: 1;
}

.node-content.is-dragover::before {
  background-color: var(--color-action-light);
  opacity: 1;
}

.node-content.is-dragover::after {
  border-color: var(--color-action);
}

.node-content.is-node-dragging {
  opacity: var(--tree-node-dragging-opacity);
}

.node-content.is-dragover .node-text-wrapper span {
  color: var(--color-text-pri);
}

.node-content.is-dragover .dir-icon {
  fill: var(--color-action);
}

.node-icon {
  width: var(--tree-icon-size);
  height: var(--tree-icon-size);
  flex-shrink: 0;
  pointer-events: none;
}

@media (hover: hover) {
  .node-content:hover .node-text-wrapper span {
    color: var(--color-text-pri);
  }

  .node-content:hover .dir-icon {
    fill: var(--color-action);
  }

  .node-content:hover::before {
    opacity: 1;
  }
}
</style>
