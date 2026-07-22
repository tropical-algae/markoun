<template>
  <div
    class="node-wrapper"
    :style="nodeIndentStyle"
  >
    <div
      class="node-content"
      :class="{
        'is-selected': selected,
        'is-dragover': dragOver,
        'is-node-dragging': dragging,
      }"
      :draggable="!renaming"
      @click="emit('clickNode')"
      @dragstart.stop="emit('dragStart', $event)"
      @dragend="emit('dragEnd', $event)"
      @dragenter.prevent.stop="emit('dragEnter', $event)"
      @dragover.prevent.stop="emit('dragOver', $event)"
      @dragleave.prevent.stop="emit('dragLeave', $event)"
      @drop.prevent.stop="emit('drop', $event)"
    >
      <button
        type="button"
        v-if="isDirectory"
        class="node-toggle-btn"
        :class="{ 'is-opened': opened, 'is-disabled': !canExpand }"
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
          <input
            v-if="renaming"
            name="node_name"
            autocomplete="off"
            :aria-label="`Rename ${name}`"
            :ref="setRenameInputRef"
            :value="editName"
            class="rename-input"
            @input="handleRenameInput"
            @click.stop
            @blur="emit('submitRename')"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
            @keydown.esc="emit('cancelRename')"
          />

          <span
            v-else
            :class="{ 'file-name': !isDirectory, 'dir-name': isDirectory }"
            @pointerdown="emit('pointerDown', $event)"
            @pointerup="emit('pointerUp', $event)"
            @pointerleave="emit('pointerLeave', $event)"
            @pointercancel="emit('pointerCancel', $event)"
          >
            {{ name }}
          </span>
        </div>
      </div>

      <span v-if="suffix" class="meta-tag">{{ suffix.toUpperCase() }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component, type ComponentPublicInstance } from 'vue'

const props = defineProps<{
  depth: number
  name: string
  suffix?: string
  icon: Component
  isDirectory: boolean
  selected: boolean
  opened: boolean
  canExpand: boolean
  dragOver: boolean
  dragging: boolean
  renaming: boolean
  editName: string
  setRenameInputRef: (element: Element | ComponentPublicInstance | null) => void
}>()

const emit = defineEmits<{
  (event: 'update:editName', value: string): void
  (event: 'clickNode'): void
  (event: 'clickDirectoryIcon'): void
  (event: 'dragStart', value: DragEvent): void
  (event: 'dragEnd', value: DragEvent): void
  (event: 'dragEnter', value: DragEvent): void
  (event: 'dragOver', value: DragEvent): void
  (event: 'dragLeave', value: DragEvent): void
  (event: 'drop', value: DragEvent): void
  (event: 'pointerDown', value: PointerEvent): void
  (event: 'pointerUp', value: PointerEvent): void
  (event: 'pointerLeave', value: PointerEvent): void
  (event: 'pointerCancel', value: PointerEvent): void
  (event: 'submitRename'): void
  (event: 'cancelRename'): void
}>()

const nodeIndentStyle = computed(() => ({
  '--tree-depth': props.depth,
}))

const handleRenameInput = (event: Event) => {
  emit('update:editName', (event.target as HTMLInputElement).value)
}
</script>

<style scoped>
.node-wrapper {
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
  width: 100%;
  min-width: 0;
  background-color: transparent;
  isolation: isolate;
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

.node-content > .meta-tag {
  flex-shrink: 0;
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

.rename-input {
  background-color: var(--color-bg-pri);
  width: 100%;
  min-height: var(--tree-node-text-height);
  border: none;
  outline: none;
  padding: 0 var(--tree-node-text-padding-x);
  margin: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-pri);
  font-family: inherit;
  font-size: var(--tree-rename-input-font-size);
  box-sizing: border-box;
  line-height: var(--tree-node-text-line-height);
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
