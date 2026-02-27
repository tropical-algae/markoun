<template>
  <div 
    class="underlined-input-wrapper" 
    :class="$attrs.class, { 'is-disabled': disabled, 'is-focused': modelValue || isFocused}"
  >
    <label class="underlined-input-label">{{ label }}</label>
    
    <div class="underlined-input-container">
      <input
        v-bind="inputAttrs"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :disabled="disabled"
        :placeholder="placeholder"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @input="handleInput"
        class="underlined-input-content"
      />
      <div class="underlined-input-line-base"></div>
      <div class="underlined-input-line-active"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue';

defineOptions({
  inheritAttrs: false
});

const attrs = useAttrs();
const inputAttrs = computed(() => {
  const { class: cls, style, ...rest } = attrs;
  return rest;
});
const isFocused = ref(false);

interface Props {
  modelValue: string | number;
  label?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}
const inputRef = ref<HTMLInputElement | null>(null);

defineExpose({
  focus: () => inputRef.value?.focus(),
  select: () => inputRef.value?.select()
});

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: 'Label',
  type: 'text',
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>


<style scoped>
.underlined-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  position: relative;
}

.underlined-input-label {
  text-transform: uppercase;
  /* letter-spacing: 1.5px; */
  color: var(--color-text-sec);
  font-weight: 600;
  transition: color 0.3s ease;
  user-select: none;
}

.underlined-input-wrapper.is-focused .underlined-input-label {
  color: var(--color-text-pri);
}

.underlined-input-container {
  position: relative;
  width: 100%;
  padding-bottom: 4px; 
}

.underlined-input-content {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  
  color: var(--color-text-pri);
  font-weight: 400;
  letter-spacing: 0.5px;
  
  &::placeholder {
    color: var(--color-text-sec);
    opacity: 0.5;
  }
}

.underlined-input-line-base {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: var(--color-line);
}

.underlined-input-line-active {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: var(--color-text-pri);
  
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.5s ease;
  
  z-index: 1;
}

.underlined-input-container:hover .underlined-input-line-active,
.underlined-input-wrapper.is-focused .underlined-input-line-active {
  transform: scaleX(1);
}

.underlined-input-wrapper.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.underlined-input-wrapper.is-disabled .underlined-input-content {
  cursor: not-allowed;
  color: var(--color-text-muted);
}

.underlined-input-wrapper.is-disabled .underlined-input-line-base {
  border-bottom: 1px dashed var(--color-line);
  background-color: transparent;
}

.underlined-input-wrapper.is-disabled .underlined-input-line-active {
  display: none;
}

</style>
