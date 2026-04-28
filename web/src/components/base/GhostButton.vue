<template>
  <button
    class="ghost-btn"
    :class="[`type-${theme}`, { 'is-loading': loading }]"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <span class="ghost-btn-content">
      <span class="ghost-btn-label" :class="{ 'is-hidden': visibleLoading }">
        <slot></slot>
      </span>
      <span v-if="visibleLoading" class="ghost-btn-spinner" aria-hidden="true"></span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { ASYNC_GATE_DELAY_MS, ASYNC_GATE_MIN_VISIBLE_MS } from '@/constants/ui';

interface Props {
  theme?: 'primary' | 'danger' | 'secondary' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  loadingDelayMs?: number;
  loadingMinDurationMs?: number;
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'primary',
  disabled: false,
  loading: false,
  loadingDelayMs: undefined,
  loadingMinDurationMs: undefined,
});

const visibleLoading = ref(false)
let loadingVisibleAt = 0
let showTimer: number | null = null
let hideTimer: number | null = null

const clearShowTimer = () => {
  if (showTimer !== null) {
    window.clearTimeout(showTimer)
    showTimer = null
  }
}

const clearHideTimer = () => {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
}

const showLoading = () => {
  if (visibleLoading.value) {
    return
  }

  visibleLoading.value = true
  loadingVisibleAt = Date.now()
}

const hideLoading = () => {
  visibleLoading.value = false
  loadingVisibleAt = 0
}

watch(
  () => props.loading,
  (loading) => {
    if (loading) {
      clearHideTimer()

      if (visibleLoading.value) {
        return
      }

      clearShowTimer()
      showTimer = window.setTimeout(() => {
        showTimer = null
        if (props.loading) {
          showLoading()
        }
      }, props.loadingDelayMs ?? ASYNC_GATE_DELAY_MS)
      return
    }

    clearShowTimer()

    if (!visibleLoading.value) {
      return
    }

    const elapsed = Date.now() - loadingVisibleAt
    const minDuration = props.loadingMinDurationMs ?? ASYNC_GATE_MIN_VISIBLE_MS
    const remaining = Math.max(0, minDuration - elapsed)

    clearHideTimer()
    if (remaining === 0) {
      hideLoading()
      return
    }

    hideTimer = window.setTimeout(() => {
      hideTimer = null
      if (!props.loading) {
        hideLoading()
      }
    }, remaining)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearShowTimer()
  clearHideTimer()
})
</script>

<style scoped>
.ghost-btn {
  --btn-main-color: var(--color-text-pri); 
  --btn-hover-text-color: var(--color-bg-pri);
  
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--ghost-button-padding);
  border-width: var(--ghost-button-border-width);
  opacity: 1;

  background-color: transparent;
  border: var(--ghost-button-border-width) solid var(--btn-main-color);
  color: var(--btn-main-color);
  border-radius: var(--button-radius);
  
  cursor: pointer;
  transition: 
    background-color var(--motion-soft-duration) var(--motion-soft-ease),
    color var(--motion-soft-duration) var(--motion-soft-ease),
    border-color var(--motion-soft-duration) var(--motion-soft-ease),
    opacity var(--motion-soft-duration) var(--motion-soft-ease);
  user-select: none;
}

.ghost-btn-content {
  display: grid;
  place-items: center;
}

.ghost-btn-label {
  grid-area: 1 / 1;
}

.ghost-btn-label.is-hidden {
  visibility: hidden;
}

.ghost-btn-spinner {
  grid-area: 1 / 1;
  width: var(--ghost-button-spinner-size);
  height: var(--ghost-button-spinner-size);
  border-radius: var(--radius-pill);
  border: var(--ghost-button-spinner-border-width) solid currentColor;
  border-right-color: transparent;
  animation: ghost-btn-spin var(--motion-spinner-duration) linear infinite;
}

.ghost-btn.type-danger {
  --btn-main-color: var(--color-bg-error);
}

.ghost-btn.type-secondary {
  --btn-main-color: var(--color-text-sec);
}

.ghost-btn:not(:disabled):hover {
  background-color: var(--btn-main-color);
  color: var(--btn-hover-text-color);
}

.ghost-btn:not(:disabled):active {
  opacity: 1;
}

.ghost-btn:disabled {
  border-style: dashed;
  opacity: 0.7;
  cursor: not-allowed;
  
  background-color: transparent;
  color: var(--btn-main-color);
}

.ghost-btn.is-loading:disabled {
  border-style: solid;
  opacity: 1;
}

@keyframes ghost-btn-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

</style>
