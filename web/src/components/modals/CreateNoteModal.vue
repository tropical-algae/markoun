<template>
  <BaseModal 
    v-model="isVisible" 
    title="New Note"
    @opened="handleOpened"
  >
    <div style="width: 360px;">

      <InputUnderline
        v-model="noteName"
        label="Note Name"
        ref="inputRef"
        type="text"
        class="mb-2 f-s"
        placeholder="e.g. my_note"
      />

      <TextHint :icon="InfoIcon" text="Created in the selected path. No extension needed." class="mb-3"/>
      
      <div class="d-flex justify-content-end gap-2">
        <GhostButton @click="isVisible = false" theme="secondary">Cancel</GhostButton>
        <GhostButton @click="handleConfirm">Create</GhostButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseModal from '@/components/common/BaseModal.vue';
import InputUnderline from '@/components/common/InputUnderline.vue';

import TextHint from '@/components/common/TextHint.vue';
import GhostButton from '@/components/common/GhostButton.vue';

import InfoIcon from "@/assets/icons/info.svg"

import { useNodeStore } from "@/scripts/stores/note"

const nodeStore = useNodeStore()
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue']);

const isVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const noteName = ref('');
const inputRef = ref<InstanceType<typeof InputUnderline> | null>(null);

const handleOpened = () => {
  inputRef.value?.focus();
}

const handleConfirm = async () => {

  if (!noteName.value.trim()) return;
  
  await nodeStore.addNewNode(noteName.value, 'file')
  
  // 初始化状态
  isVisible.value = false;
  noteName.value = '';
};

</script>
