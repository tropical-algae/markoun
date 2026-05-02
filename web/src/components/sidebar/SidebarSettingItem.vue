<template>
  <div class="d-flex justify-content-between align-items-center pb-2">
    
    <div class="setting-copy d-flex flex-column pe-3">
      <span class="fw-bold f-s fc-pri">{{ setting.name }}</span>
      <span class="text-truncate f-xs fc-sec">{{ setting.desc }}</span>
    </div>

    <div class="flex-shrink-0">
      
      <div v-if="setting.type === SysSettingType.BOOL">
        <label
          class="switch-control"
          :class="{ 'is-disabled': pending }"
          :for="setting.id"
        >
        <input 
          class="switch-input"
          type="checkbox" 
          :id="setting.id"
          :checked="(setting as BoolSysSetting).value"
          :disabled="pending"
          @change="handleChange($event)"
        >
          <span class="switch-track"></span>
        </label>
      </div>

      <div v-else-if="setting.type === SysSettingType.STR">
        <input 
          type="text" 
          class="setting-text-input form-control form-control-sm text-end"
          :value="draftValue"
          :disabled="pending"
          @input="handleInput($event)"
          @blur="commitDraft"
          @keydown.enter.prevent="commitDraft"
          placeholder="Enter value"
        >
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { SysSettingType, type BoolSysSetting, type SysSettingResponse } from '@/types/system';


const props = defineProps<{
  setting: SysSettingResponse
  pending?: boolean
}>();

const emit = defineEmits<{
  (e: 'update', id: string, newValue: string | boolean): void
}>();

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  
  if (props.setting.type === SysSettingType.BOOL) {
    emit('update', props.setting.id, target.checked);
  }
};

const draftValue = ref(props.setting.type === SysSettingType.STR ? props.setting.value : '')

watch(
  () => props.setting,
  (setting) => {
    if (setting.type === SysSettingType.STR) {
      draftValue.value = setting.value
    }
  },
  { deep: true, immediate: true }
)

const handleInput = (event: Event) => {
  draftValue.value = (event.target as HTMLInputElement).value
}

const commitDraft = () => {
  if (props.setting.type !== SysSettingType.STR) {
    return
  }

  if (draftValue.value === props.setting.value) {
    return
  }

  emit('update', props.setting.id, draftValue.value)
}
</script>

<style scoped>
.setting-copy {
  min-width: 0;
}

.setting-text-input {
  width: var(--setting-text-input-width);
}
</style>
