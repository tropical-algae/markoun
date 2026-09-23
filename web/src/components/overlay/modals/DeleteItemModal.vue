<template>
  <BaseModal
    v-model="isVisible"
    title="Delete Item"
  >
    <ModalContentLayout class="delete-item-modal fc-pri">
      <div>Delete <span class="fw-bold">{{ targetPath }}</span>?</div>
      <div class="f-s fc-sec">
        {{ deleteDescription }} This action cannot be undone.
      </div>

      <template #actions>
        <GhostButton
          class="modal-button f-s"
          @click="isVisible = false"
          theme="secondary"
          :disabled="nodeStore.isDeletePending()"
        >
          Cancel
        </GhostButton>
        <GhostButton
          class="modal-button f-s"
          @click="handleConfirm"
          theme="danger"
          :disabled="nodeStore.isDeletePending()"
          :loading="nodeStore.isDeletePending()"
        >
          Delete
        </GhostButton>
      </template>
    </ModalContentLayout>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import ModalContentLayout from '@/layouts/ModalContentLayout.vue'

import { useNodeStore } from '@/stores/note'
import { useModelProxy } from '@/composables/useModelProxy'

const nodeStore = useNodeStore()
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const targetPath = ref('Default Page')
const targetType = ref<'file' | 'dir' | null>(null)
const isVisible = useModelProxy(props, emit)
const deleteDescription = computed(() => {
  if (targetType.value === 'dir') {
    return 'This folder and everything inside it will be removed from your workspace.'
  }
  if (targetType.value === 'file') {
    return 'This file will be removed from your workspace.'
  }
  return 'This item will be removed from your workspace.'
})

watch(
  () => isVisible.value,
  (visible) => {
    if (visible) {
      targetPath.value = nodeStore.currentNode?.path ?? 'Default Page'
      targetType.value = nodeStore.currentNode?.type ?? null
    }
  },
  { immediate: true }
)

const handleConfirm = async () => {
  await nodeStore.deleteCurrentNode()
  isVisible.value = false
}
</script>

<style scoped>
.delete-item-modal {
  width: var(--modal-width-sm);
  max-width: 100%;
}

.delete-item-modal > div {
  overflow-wrap: anywhere;
}
</style>
