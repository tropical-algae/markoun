<template>
  <button
    class="ghost-btn"
    :class="[`type-${theme}`, { 'is-loading': loading }]"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <span class="ghost-btn-content">
      <span class="ghost-btn-label" :class="{ 'is-hidden': loading }">
        <slot></slot>
      </span>
      <span v-if="loading" class="ghost-btn-spinner" aria-hidden="true"></span>
    </span>
  </button>
</template>

<script setup lang="ts">

interface Props {
  theme?: 'primary' | 'danger' | 'secondary' | 'submit';
  disabled?: boolean;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  theme: 'primary',
  disabled: false,
  loading: false,
});
</script>

<style scoped>
.ghost-btn {
  --btn-main-color: var(--color-text-pri); 
  --btn-hover-text-color: var(--color-bg-pri);
  
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 16px;
  border-width: 6px;
  opacity: 1;

  background-color: transparent;
  border: 1.5px solid var(--btn-main-color);
  color: var(--btn-main-color);
  border-radius: 6px;
  
  cursor: pointer;
  will-change: background-color, color, border-color, opacity;
  transition: 
    background-color 0.4s ease-in-out, 
    color 0.4s ease-in-out, 
    border-color 0.4s ease-in-out, 
    opacity 0.4s ease-in-out;
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
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 999px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: ghost-btn-spin 0.7s linear infinite;
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
  cursor: wait;
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
