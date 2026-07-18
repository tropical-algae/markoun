<template>
  <div :class="$attrs.class" class="filled-input-shell">
    <div class="filled-input-wrapper">
      <label :for="uniqueId" class="filled-input-label">{{ label }}</label>

      <input
        :id="uniqueId"
        ref="inputRef"
        v-bind="inputAttrs"
        :value="modelValue"
        class="filled-input-content"
        @input="handleInput"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, useId } from 'vue'

defineOptions({
  inheritAttrs: false
})

withDefaults(defineProps<{
  label: string
  modelValue: string
}>(), {
  modelValue: ''
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const attrs = useAttrs()
const generatedId = useId()
const uniqueId = computed(() => String(attrs.id ?? generatedId))
const inputRef = ref<HTMLInputElement | null>(null)

defineExpose({
  focus: () => inputRef.value?.focus(),
  select: () => inputRef.value?.select()
})

const inputAttrs = computed(() => {
  const rest = { ...attrs }
  delete rest.class
  delete rest.style
  return rest
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.filled-input-shell {
  padding-top: var(--filled-input-shell-padding-top);
}

.filled-input-wrapper {
  position: relative;
  border-radius: var(--input-radius);
  padding: var(--filled-input-padding);
  transition: background-color var(--motion-medium-duration) ease;
  background-color: var(--color-bg-field);
}

.filled-input-wrapper:focus-within {
  background-color: var(--color-bg-selected);
}

.filled-input-wrapper:focus-within .filled-input-label::before {
  background-color: var(--color-bg-selected);
}

.filled-input-label {
  position: absolute;
  padding: 0 var(--filled-input-label-padding-x);
  top: var(--filled-input-label-top);
  left: var(--filled-input-label-left);
  height: var(--filled-input-label-height);
  display: flex;
  align-items: center;
  pointer-events: none;
  font-size: var(--filled-input-label-font-size);
  color: var(--color-text-sec);
  font-weight: 600;
  z-index: 1;
}

.filled-input-label::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: var(--filled-input-label-bg-bleed-bottom);
  left: 0;
  right: 0;
  border-radius: var(--input-radius);
  pointer-events: none;
  z-index: -1;
  transition: background-color var(--motion-medium-duration) ease;
  background-color: var(--color-bg-field);
}

.filled-input-content {
  position: relative;
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: var(--filled-input-content-font-size);
  border-radius: var(--input-radius);
  color: var(--color-text-pri);
  font-family: inherit;
  z-index: 2;
}

.filled-input-content::placeholder {
  color: var(--color-text-muted);
}
</style>
