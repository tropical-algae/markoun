<template>
  <div 
    class="input-underline-wrapper" 
    :class="$attrs.class, { 'is-disabled': disabled, 'is-focused': modelValue || isFocused}"
  >
    <label class="input-underline-label">{{ label }}</label>
    
    <div class="input-underline-container">
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
        class="input-underline-content"
      />
      <div class="input-underline-line-base"></div>
      <div class="input-underline-line-active"></div>
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
