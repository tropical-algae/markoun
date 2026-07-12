<template>
  <div class="setting-item">
    
    <div class="setting-copy">
      <span class="fw-bold f-s fc-pri">{{ settingName }}</span>
      <span class="setting-desc f-xs fc-sec">{{ settingDesc }}</span>
    </div>

    <div class="setting-control">
      <slot name="control"></slot>
      
      <div v-if="!hasControlSlot && setting?.type === SysSettingType.BOOL">
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
          <span class="switch-track" aria-hidden="true"></span>
        </label>
      </div>

      <div v-else-if="!hasControlSlot && setting?.type === SysSettingType.STR">
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
import { computed, ref, useSlots, watch } from 'vue';
import { SysSettingType, type BoolSysSetting, type SysSettingResponse } from '@/types/system';


const props = defineProps<{
  setting?: SysSettingResponse
  name?: string
  desc?: string
  pending?: boolean
}>();

const emit = defineEmits<{
  (e: 'update', id: string, newValue: string | boolean): void
}>();

const slots = useSlots()
const hasControlSlot = computed(() => Boolean(slots.control))
const settingName = computed(() => props.setting?.name ?? props.name ?? '')
const settingDesc = computed(() => props.setting?.desc ?? props.desc ?? '')

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  
  if (props.setting?.type === SysSettingType.BOOL) {
    emit('update', props.setting.id, target.checked);
  }
};

const draftValue = ref(props.setting?.type === SysSettingType.STR ? props.setting.value : '')

watch(
  () => props.setting,
  (setting) => {
    if (setting?.type === SysSettingType.STR) {
      draftValue.value = setting.value
    }
  },
  { deep: true, immediate: true }
)

const handleInput = (event: Event) => {
  draftValue.value = (event.target as HTMLInputElement).value
}

const commitDraft = () => {
  if (props.setting?.type !== SysSettingType.STR) {
    return
  }

  if (draftValue.value === props.setting.value) {
    return
  }

  emit('update', props.setting.id, draftValue.value)
}
</script>

<style scoped>
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--settings-skeleton-gap);
  padding-bottom: 0.5rem;
}

.setting-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.setting-desc {
  white-space: normal;
  overflow-wrap: anywhere;
}

.setting-control {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.setting-text-input {
  width: var(--setting-text-input-width);
}

@media (max-width: 768px) {
  .setting-item {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--hint-gap);
  }

  .setting-control,
  .setting-control > div {
    width: 100%;
  }

  .setting-text-input {
    width: 100%;
  }
}
</style>
