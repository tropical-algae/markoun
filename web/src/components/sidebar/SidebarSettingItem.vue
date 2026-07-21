<template>
  <div class="setting-item">
    <div class="setting-copy">
      <span class="fw-bold f-s fc-pri">{{ settingName }}</span>
      <span class="setting-desc f-xs fc-sec">{{ settingDesc }}</span>
    </div>

    <div class="setting-control">
      <slot name="control"></slot>

      <div v-if="boolSetting">
        <label
          class="switch-control"
          :class="{ 'is-disabled': pending }"
          :for="boolSetting.id"
        >
          <input
            class="switch-input"
            type="checkbox"
            :id="boolSetting.id"
            :checked="boolSetting.value"
            :disabled="pending"
            @change="handleBoolChange"
          >
          <span class="switch-track" aria-hidden="true"></span>
        </label>
      </div>

      <div v-else-if="strSetting">
        <input
          type="text"
          class="setting-text-input"
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
import { computed, ref, useSlots, watch } from 'vue'
import {
  SysSettingType,
  type BoolSysSetting,
  type StrSysSetting,
  type SysSettingResponse,
} from '@/types/system'

const props = defineProps<{
  setting?: SysSettingResponse
  name?: string
  desc?: string
  pending?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', id: string, newValue: string | boolean): void
}>()

const slots = useSlots()
const hasControlSlot = computed(() => Boolean(slots.control))
const settingName = computed(() => props.setting?.name ?? props.name ?? '')
const settingDesc = computed(() => props.setting?.desc ?? props.desc ?? '')
const boolSetting = computed<BoolSysSetting | null>(() => {
  if (hasControlSlot.value || props.setting?.type !== SysSettingType.BOOL) {
    return null
  }
  return props.setting
})
const strSetting = computed<StrSysSetting | null>(() => {
  if (hasControlSlot.value || props.setting?.type !== SysSettingType.STR) {
    return null
  }
  return props.setting
})

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

const handleBoolChange = (event: Event) => {
  if (!boolSetting.value) {
    return
  }

  emit('update', boolSetting.value.id, (event.target as HTMLInputElement).checked)
}

const handleInput = (event: Event) => {
  draftValue.value = (event.target as HTMLInputElement).value
}

const commitDraft = () => {
  if (!strSetting.value || draftValue.value === strSetting.value.value) {
    return
  }

  emit('update', strSetting.value.id, draftValue.value)
}
</script>

<style scoped>
.setting-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-lg);
  padding-bottom: var(--space-sm);
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
  width: auto;
}

.setting-control > div {
  width: auto;
}

.setting-text-input {
  width: var(--setting-text-input-width);
  padding: var(--space-xs) var(--space-sm);
  border: var(--line-width) solid var(--color-line);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-field);
  color: var(--color-text-pri);
  font-size: var(--setting-text-input-font-size);
  line-height: var(--setting-text-input-line-height);
  text-align: end;
  box-sizing: border-box;
  transition:
    background-color var(--motion-soft-duration) ease,
    border-color var(--motion-soft-duration) ease,
    box-shadow var(--motion-soft-duration) ease;
}

.setting-text-input:focus {
  border-color: var(--color-action);
  box-shadow: 0 0 0 var(--control-focus-ring-size) var(--color-action-light);
  outline: none;
}

.setting-text-input:disabled {
  cursor: not-allowed;
  opacity: var(--opacity-disabled);
}
</style>
