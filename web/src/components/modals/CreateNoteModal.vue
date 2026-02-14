<template>
  <BaseModal 
    v-model="isVisible" 
    title="New Note"
    @opened="handleOpened"
  >
    <div style="width: 340px;">

      <InputField
        v-model="folderName"
        ref="inputRef"
        label="Note Name"
        type="text"
        class="mb-2"
        placeholder="e.g. my_note"
      />

      <TextHint :icon="InfoIcon" text="Created in the selected path. No extension needed." class="mb-3 mx-1"/>
      
      <div class="d-flex justify-content-end gap-2">
        <GhostButton @click="isVisible = false" type="secondary">Cancel</GhostButton>
        <GhostButton @click="handleConfirm">Create</GhostButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseModal from '@/components/common/BaseModal.vue';
import InputField from '@/components/common/InputField.vue';
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

const folderName = ref('');
const inputRef = ref<InstanceType<typeof InputField> | null>(null);

const handleOpened = () => {
  inputRef.value?.focus();
}

const handleConfirm = async () => {

  if (!folderName.value.trim()) return;
  
  console.log(folderName.value)
  await nodeStore.addNewNode(folderName.value, 'file')
  
  // 初始化状态
  isVisible.value = false;
  folderName.value = '';
};

</script>
