<template>
  <div :class="$attrs.class" style="padding-top: 14px;">
    <div class="filled-input-wrapper">
      <label :for="uniqueId" class="filled-input-label">{{ label }}</label>
      
      <input
        :id="uniqueId"
        ref="inputRef"
        v-bind="inputAttrs"
        :value="modelValue"
        class="filled-input-content"
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
const uniqueId = `filled-input-${instance?.uid}`;
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


<style scoped>
.filled-input-wrapper {
  position: relative;
  border-radius: 8px;
  padding: 7px 12px;
  transition: background-color 0.3s ease;
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
  padding: 0px 14px;
  top: -14px;
  left: 0px;
  height: 28px;
  display: flex;
  align-items: center;
  pointer-events: none;
  font-size: 0.75rem;
  color: var(--color-text-sec);
  font-weight: 600;
  z-index: 1;
}

.filled-input-label::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: -20px;
  left: 0;
  right: 0;
  border-radius: 8px;
  pointer-events: none;
  z-index: -1;
  transition: background-color 0.3s ease;
  background-color: var(--color-bg-field);
}

.filled-input-content {
  position: relative;
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  border-radius: 8px;
  color: var(--color-text-pri);
  font-family: inherit;
  z-index: 2;
}

.filled-input-content::input-placeholder{
	color: var(--color-text-trifle);
}
.filled-input-content::-webkit-input-placeholder{
	color: var(--color-text-trifle);
}
.filled-input-content::-moz-placeholder{
	color: var(--color-text-trifle);
}
.filled-input-content::-moz-placeholder{
	color: var(--color-text-trifle);
}
.filled-input-content::-ms-input-placeholder{
	color: var(--color-text-trifle);
}

</style>
