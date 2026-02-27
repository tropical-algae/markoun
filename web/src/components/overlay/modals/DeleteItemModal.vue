<template>
  <BaseModal 
    v-model="isVisible" 
    title="Delete Item"
  >
    <div style="width: 360px;">
      <p>Are you sure you want to delete <span class="fw-bold">{{ targetPath }}</span> ?</p>
      <div class="d-flex justify-content-end gap-2">
        <GhostButton class="f-s py-0" @click="isVisible = false" theme="secondary">Cancel</GhostButton>
        <GhostButton class="f-s py-0" @click="handleConfirm" type="danger">Delete</GhostButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseModal from '@/components/base/BaseModal.vue';
import GhostButton from '@/components/base/GhostButton.vue';

import { useNodeStore } from "@/stores/note"

const nodeStore = useNodeStore()
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue']);

const targetPath = ref('Default Page')
const isVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

watch(
  () => isVisible.value,
  (visible) => {
    if (visible) {
      targetPath.value = nodeStore.currentNode?.path ?? 'Default Page'
    }
  },
  { immediate: true }
)

const handleConfirm = async () => {
  await nodeStore.deletedItem()
  
  // 初始化状态
  isVisible.value = false;
};

</script>
