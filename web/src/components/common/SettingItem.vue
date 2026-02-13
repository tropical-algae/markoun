<template>
  <div class="d-flex justify-content-between align-items-center pb-2">
    
    <div class="d-flex flex-column pe-3" style="min-width: 0;">
      <span class="fw-bold f-s">{{ setting.name }}</span>
      <span class="text-truncate f-xs">{{ setting.desc }}</span>
    </div>

    <div class="flex-shrink-0">
      
      <div v-if="setting.type === SysSettingType.BOOL" class="form-check form-switch m-0">
        <input 
          class="form-check-input" 
          type="checkbox" 
          :id="setting.id"
          :checked="(setting as BoolSysSetting).value"
          @change="handleChange($event)"
          style="cursor: pointer;"
        >
      </div>

      <div v-else-if="setting.type === SysSettingType.STR">
        <input 
          type="text" 
          class="form-control form-control-sm text-end"
          :value="(setting as StrSysSetting).value"
          @input="handleChange($event)"
          placeholder="Enter value"
          style="width: 120px;"
        >
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { SysSettingType, type SysSettingResponse, type BoolSysSetting, type StrSysSetting } from '@/scripts/types';


const props = defineProps<{
  setting: SysSettingResponse
}>();

const emit = defineEmits<{
  (e: 'update', id: string, newValue: string | boolean): void
}>();

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  
  if (props.setting.type === SysSettingType.BOOL) {
    emit('update', props.setting.id, target.checked);
  } else {
    emit('update', props.setting.id, target.value);
  }
};
</script>
