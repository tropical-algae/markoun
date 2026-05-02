<template>
  <div class="d-flex justify-content-between align-items-center pb-2">
    <div class="setting-copy d-flex flex-column pe-3">
      <span class="fw-bold f-s fc-pri">Theme Mode</span>
      <span class="text-truncate f-xs fc-sec">Switch between light and dark interface.</span>
    </div>

    <div class="theme-options">
      <button
        v-for="option in themeStore.themeOptions"
        :key="option.id"
        class="theme-option f-s"
        :class="{ 'is-active': themeStore.currentTheme === option.id }"
        :data-theme="option.id"
        :aria-label="`Use ${option.label} theme`"
        :aria-pressed="themeStore.currentTheme === option.id"
        @click="themeStore.setTheme(option.id)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<style scoped>
.setting-copy {
  min-width: 0;
}

.theme-options {
  display: flex;
  align-items: center;
  gap: var(--theme-option-gap);
  flex-shrink: 0;
}

.theme-option {
  /* min-width: var(--theme-option-width);
  height: var(--theme-option-height); */
  border: 1px solid var(--color-line);
  border-radius: var(--theme-option-radius);
  background: var(--color-bg-field);
  color: var(--color-text-sec);
  padding: var(--theme-option-padding-y) var(--theme-option-padding-x);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    color var(--motion-soft-duration) ease,
    background-color var(--motion-soft-duration) ease,
    border-color var(--motion-soft-duration) ease;
}

.theme-option:hover,
.theme-option.is-active {
  border-color: var(--color-action);
  color: var(--color-action);
}

.theme-option.is-active {
  background-color: var(--color-action-light);
  /* box-shadow: 0 0 0 2px var(--color-action-light); */
}
</style>
