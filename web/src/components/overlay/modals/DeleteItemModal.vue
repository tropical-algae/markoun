<template>
  <BaseModal
    v-model="isVisible"
    title="Delete Item"
    :close-on-backdrop="!isPending"
    :close-on-escape="!isPending"
  >
    <ModalContentLayout class="delete-item-modal fc-pri">
      <div>Delete '<span class="fw-bold">{{ target?.path }}</span>'?</div>
      <div class="f-s fc-sec delete-item-message">
        {{ deleteDescription }}<br/>
        This action cannot be undone.
      </div>

      <template #actions>
        <GhostButton
          class="modal-button f-s"
          @click="isVisible = false"
          theme="secondary"
          :disabled="isPending"
        >
          Cancel
        </GhostButton>
        <GhostButton
          class="modal-button f-s"
          @click="handleConfirm"
          theme="danger"
          :disabled="isPending || !target"
          :loading="isPending"
        >
          Delete
        </GhostButton>
      </template>
    </ModalContentLayout>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import ModalContentLayout from '@/layouts/ModalContentLayout.vue'

import { useWorkspaceActions } from '@/composables/useWorkspaceActions'
import { useModelProxy } from '@/composables/useModelProxy'
import type { SelectedItem } from '@/types/file-system'

const workspace = useWorkspaceActions()
const props = defineProps<{ modelValue: boolean, target: SelectedItem | null }>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const isPending = ref(false)
const isVisible = useModelProxy(props, emit)
const deleteDescription = computed(() => props.target?.type === 'dir'
  ? 'This folder and everything inside it will be removed from your workspace.'
  : 'This file will be removed from your workspace.')

const handleConfirm = async () => {
  if (!props.target || isPending.value) return
  isPending.value = true
  try {
    await workspace.deleteNode(props.target)
    isVisible.value = false
  } catch {
    // The request handler reports failures.
  } finally {
    isPending.value = false
  }
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

.delete-item-message {
  margin-top: var(--space-sm);
}
</style>
