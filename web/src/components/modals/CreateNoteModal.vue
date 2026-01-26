<template>
  <BaseModal 
    v-model="isVisible" 
    title="New Note"
    @opened="handleOpened"
  >
    <div style="width: 320px;">

      <InputField
        v-model="folderName"
        ref="inputRef"
        label="Folder Name"
        type="text"
        class="mb-3"
        placeholder="e.g. my_note"
      />
      
      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-sm btn-secondary" @click="isVisible = false">Cancel</button>
        <button class="btn btn-sm btn-primary" @click="handleConfirm">Create</button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseModal from '@/components/common/BaseModal.vue';
import InputField from '@/components/common/InputField.vue';

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

const handleConfirm = () => {

  if (!folderName.value.trim()) return;
  
  console.log(folderName.value)
  
  // 初始化状态
  isVisible.value = false;
  folderName.value = '';
};

</script>
