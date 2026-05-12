<template>
  <BaseModal 
    v-model="isVisible" 
    title="Delete Item"
  >
    <div class="delete-item-modal fc-pri">
      <p>Delete <span class="fw-bold">{{ targetPath }}</span> ?</p>
      <div class="d-flex justify-content-end gap-2">
        <GhostButton
          class="f-s py-0"
          @click="isVisible = false"
          theme="secondary"
          :disabled="nodeStore.isDeletePending()"
        >
          Cancel
        </GhostButton>
        <GhostButton
          class="f-s py-0"
          @click="handleConfirm"
          theme="danger"
          :disabled="nodeStore.isDeletePending()"
          :loading="nodeStore.isDeletePending()"
        >
          Delete
        </GhostButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import GhostButton from '@/components/base/GhostButton.vue'

import { useNodeStore } from "@/stores/note"
import { useModelProxy } from '@/composables/useModelProxy'

const nodeStore = useNodeStore()
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const targetPath = ref('Default Page')
const isVisible = useModelProxy(props, emit)

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
  isVisible.value = false
}

</script>

<style scoped>
.delete-item-modal {
  width: var(--modal-width-sm);
}
</style>
