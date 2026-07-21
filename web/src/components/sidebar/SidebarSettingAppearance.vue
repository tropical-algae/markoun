<template>
  <SidebarSettingItem
    name="Theme Mode"
    desc="Switch between light and dark interface."
  >
    <template #control>
      <div class="theme-options">
        <button
          v-for="option in appearanceStore.themeOptions"
          :key="option.id"
          class="theme-option f-s"
          :class="{ 'is-active': appearanceStore.currentTheme === option.id }"
          :data-theme="option.id"
          :aria-label="`Use ${option.label} theme`"
          :aria-pressed="appearanceStore.currentTheme === option.id"
          @click="appearanceStore.setTheme(option.id)"
        >
          {{ option.label }}
        </button>
      </div>
    </template>
  </SidebarSettingItem>

  <SidebarSettingItem
    v-for="setting in boolSettings"
    :key="setting.id"
    :setting="setting"
    @update="handleBoolSettingUpdate"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppearanceStore } from '@/stores/appearance'
import SidebarSettingItem from '@/components/sidebar/SidebarSettingItem.vue'
import { SysSettingType, type SysSettingResponse } from '@/types/system'

const appearanceStore = useAppearanceStore()

const boolSettings = computed<SysSettingResponse[]>(() => [
  {
    id: 'appearance-tooltips',
    name: 'Bubble Hints',
    desc: 'Show helper bubbles when hovering icon buttons.',
    type: SysSettingType.BOOL,
    value: appearanceStore.showTooltips,
  },
  {
    id: 'appearance-wide-editor-lines',
    name: 'Wide Editor Lines',
    desc: 'Use the full editor width instead of the focused text column.',
    type: SysSettingType.BOOL,
    value: appearanceStore.useWideEditorLines,
  },
])

const handleBoolSettingUpdate = (id: string, value: string | boolean) => {
  if (typeof value !== 'boolean') {
    return
  }

  if (id === 'appearance-tooltips') {
    appearanceStore.setShowTooltips(value)
    return
  }

  if (id === 'appearance-wide-editor-lines') {
    appearanceStore.setUseWideEditorLines(value)
  }
}
</script>

<style scoped>
.theme-options {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  flex-shrink: 0;
  width: auto;
}

.theme-option {
  border: var(--line-width) solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-bg-field);
  color: var(--color-text-sec);
  padding: var(--space-2xs) var(--space-sm);
  display: inline-flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    color var(--motion-soft-duration) ease,
    background-color var(--motion-soft-duration) ease,
    border-color var(--motion-soft-duration) ease;
}

.theme-option.is-active {
  border-color: var(--color-action);
  color: var(--color-action);
}

.theme-option.is-active {
  background-color: var(--color-action-light);
}

@media (hover: hover) {
  .theme-option:hover {
    border-color: var(--color-action);
    color: var(--color-action);
  }
}
</style>
