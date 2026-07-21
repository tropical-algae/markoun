<template>
  <BaseHeader>
    <div class="editor-header-actions">
      <BaseTooltip text="Save note" placement="bottom">
        <button
          class="icon-btn"
          :class="{ 'is-pending': savePending }"
          @click="emit('save')"
          :disabled="savePending"
          aria-label="Save note"
        >
          <component :is="SaveIcon"></component>
        </button>
      </BaseTooltip>
    </div>

    <div class="editor-title-slot">
      <span class="editor-title-text fc-pri">
        {{ title }}
      </span>
    </div>

    <div class="editor-header-actions">
      <BaseTooltip
        v-for="item in inspectActions"
        :key="item.label"
        :text="item.label"
        placement="bottom"
      >
        <button
          class="icon-btn"
          :class="{ active: inspectorOpen && activeMode === item.mode }"
          @click="emit('toggleInspector', item.mode)"
          :aria-label="item.label"
          :aria-pressed="inspectorOpen && activeMode === item.mode"
        >
          <component :is="item.icon"></component>
        </button>
      </BaseTooltip>
    </div>
  </BaseHeader>
</template>

<script setup lang="ts">
import { InspectMode } from '@/types/ui'
import PreviewIcon from '@/assets/icons/overview.svg'
import MetaIcon from '@/assets/icons/info.svg'
import SaveIcon from '@/assets/icons/disk.svg'
import BaseHeader from '@/components/base/BaseHeader.vue'
import BaseTooltip from '@/components/base/BaseTooltip.vue'

defineProps<{
  title: string
  savePending: boolean
  inspectorOpen: boolean
  activeMode: InspectMode
}>()

const emit = defineEmits<{
  (event: 'save'): void
  (event: 'toggleInspector', mode: InspectMode): void
}>()

const inspectActions = [
  { icon: MetaIcon, label: 'File meta', mode: InspectMode.Meta },
  { icon: PreviewIcon, label: 'Preview', mode: InspectMode.Preview },
] as const
</script>

<style scoped>
.editor-header-actions {
  display: flex;
  flex: 0 0 auto;
  gap: var(--space-sm);
}

.editor-title-slot {
  flex: 1 1 auto;
  min-width: 0;
  padding-inline: var(--space-lg);
}

.editor-title-text {
  display: block;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-btn.is-pending {
  opacity: var(--opacity-disabled);
}
</style>
