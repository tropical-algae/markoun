<template>
  <BaseModal 
    v-model="isVisible" 
    title="Delete Item"
  >
    <div style="width: 340px;">
      <p>Are you sure you want to delete {{ nodeStore.currentNode?.path ?? 'item' }}?</p>
      <div class="d-flex justify-content-end gap-2">
        <button class="cancel px-3 py-1" @click="isVisible = false">Cancel</button>
        <button class="confirm px-3 py-1" @click="handleConfirm">Delete</button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseModal from '@/components/common/BaseModal.vue';

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
