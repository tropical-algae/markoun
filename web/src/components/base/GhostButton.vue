<template>
  <button
    class="ghost-btn"
    :type="type"
    :class="[`type-${theme}`, { 'is-loading': loading }]"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <span class="ghost-btn-content">
      <span class="ghost-btn-label" :class="{ 'is-hidden': visibleLoading }">
        <slot></slot>
      </span>
      <span
        class="ghost-btn-spinner"
        :class="{ 'is-visible': visibleLoading }"
        aria-hidden="true"
      ></span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDelayedVisibility } from '@/composables/useDelayedVisibility'
import { readCssTimeMs } from '@/utils/css'

interface Props {
  type?: 'button' | 'submit' | 'reset'
  theme?: 'primary' | 'danger' | 'secondary' | 'submit'
  disabled?: boolean
  loading?: boolean
  loadingDelayMs?: number
  loadingMinDurationMs?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  theme: 'primary',
  disabled: false,
  loading: false,
  loadingDelayMs: undefined,
  loadingMinDurationMs: undefined,
})

const visibleLoading = useDelayedVisibility(
  () => props.loading,
  {
    delayMs: computed(() =>
      props.loadingDelayMs ?? readCssTimeMs('--async-gate-delay-ms', 150)
    ),
    minVisibleMs: computed(() =>
      props.loadingMinDurationMs ?? readCssTimeMs('--async-gate-min-visible-ms', 400)
    ),
  },
)
</script>

<style scoped>
.ghost-btn {
  --btn-main-color: var(--color-text-pri);
  --btn-hover-text-color: var(--color-bg-pri);

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--ghost-button-padding);
  opacity: 1;

  background-color: transparent;
  box-shadow: inset 0 0 0 var(--line-width) var(--btn-main-color);

  color: var(--btn-main-color);
  border-radius: var(--radius-md);
  overflow: hidden;

  cursor: pointer;
  transition:
    color var(--motion-soft-duration) ease,
    border-color var(--motion-soft-duration) ease,
    opacity var(--motion-soft-duration) ease;
  user-select: none;
}

.ghost-btn::before {
  position: absolute;
  inset: var(--ghost-button-bg-bleed);
  z-index: 0;
  background-color: var(--btn-main-color);

  content: "";
  opacity: 0;
  pointer-events: none;
  transition:
    opacity var(--motion-soft-duration) ease,
    background-color var(--motion-soft-duration) ease;
}

.ghost-btn-content {
  position: relative;
  z-index: 1;
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
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--motion-soft-duration) ease;
}

.ghost-btn-spinner.is-visible {
  opacity: 1;
  visibility: visible;
}

.ghost-btn.type-secondary {
  --btn-main-color: var(--color-text-sec);
}

.ghost-btn.type-danger {
  --btn-main-color: var(--color-bg-error);
}

.ghost-btn.is-loading::before {
  opacity: 1;
}

@media (hover: hover) {
  .ghost-btn:not(:disabled):hover {
    color: var(--btn-hover-text-color);
  }

  .ghost-btn:not(:disabled):hover::before {
    opacity: 1;
  }
}

.ghost-btn:not(:disabled):active {
  opacity: 1;
}

.ghost-btn:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
  color: var(--btn-main-color);
}

.ghost-btn.is-loading:disabled {
  opacity: 1;
  color: var(--btn-hover-text-color);
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
