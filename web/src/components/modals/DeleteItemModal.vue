<template>
  <BaseModal 
    v-model="isVisible" 
    title="Delete Item"
  >
    <div style="width: 360px;">
      <p>Are you sure you want to delete <span class="fw-bold">{{ nodeStore.currentNode?.path ?? 'Default Page' }}</span> ?</p>
      <div class="d-flex justify-content-end gap-2">
        <GhostButton @click="isVisible = false" theme="secondary">Cancel</GhostButton>
        <GhostButton @click="handleConfirm" type="danger">Delete</GhostButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseModal from '@/components/common/BaseModal.vue';
import GhostButton from '@/components/common/GhostButton.vue';

import { useNodeStore } from "@/scripts/stores/note"

const nodeStore = useNodeStore()
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue']);

const isVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});



const handleConfirm = async () => {
  await nodeStore.deletedItem()
  
  // 初始化状态
  isVisible.value = false;
};

</script>
