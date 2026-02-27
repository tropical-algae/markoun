<template>
  <div :class="$attrs.class" style="padding-top: 14px;">
    <div class="input-field-wrapper">
      <label :for="uniqueId" class="input-field-label">{{ label }}</label>
      
      <input
        :id="uniqueId"
        ref="inputRef"
        v-bind="inputAttrs"
        :value="modelValue"
        class="input-field-content"
        autocomplete="off"
        @input="handleInput" 
      />
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useAttrs, getCurrentInstance } from 'vue';

defineOptions({
  inheritAttrs: false
});

const props = withDefaults(defineProps<{
  label: string;
  modelValue: string | number;
}>(), {
  modelValue: ''
});

const emit = defineEmits(['update:modelValue']);

const attrs = useAttrs();
const instance = getCurrentInstance();
const uniqueId = `input-field-${instance?.uid}`;
const inputRef = ref<HTMLInputElement | null>(null);

defineExpose({
  focus: () => inputRef.value?.focus(),
  select: () => inputRef.value?.select()
});

const inputAttrs = computed(() => {
  const { class: cls, style, ...rest } = attrs;
  return rest;
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>
