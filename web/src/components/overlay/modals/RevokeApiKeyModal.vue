<template>
  <BaseModal v-model="isVisible" title="Revoke API Key">
    <ModalContentLayout class="revoke-api-key-modal fc-pri">
      <div>Revoke API key <span class="fw-bold">{{ apiKey?.name }}</span>?</div>
      <div class="f-s fc-sec">
        Agents using this key will immediately lose access. This action cannot be undone.
      </div>

      <template #actions>
        <GhostButton
          class="modal-button f-s"
          theme="secondary"
          :disabled="pending"
          @click="isVisible = false"
        >
          Cancel
        </GhostButton>
        <GhostButton
          class="modal-button f-s"
          theme="danger"
          :disabled="pending || !apiKey"
          :loading="pending"
          @click="confirmRevoke"
        >
          Revoke
        </GhostButton>
      </template>
    </ModalContentLayout>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ApiKeyInfo } from '@/types/api-key'
import BaseModal from '@/components/base/BaseModal.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import ModalContentLayout from '@/layouts/ModalContentLayout.vue'

const props = defineProps<{
  modelValue: boolean
  apiKey: ApiKeyInfo | null
  pending: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'confirm', keyId: string): void
}>()

const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    if (!value && props.pending) {
      return
    }
    emit('update:modelValue', value)
  },
})

const confirmRevoke = () => {
  if (props.apiKey && !props.pending) {
    emit('confirm', props.apiKey.id)
  }
}
</script>

<style scoped>
.revoke-api-key-modal {
  width: var(--modal-width-sm);
  max-width: 100%;
}

.revoke-api-key-modal p {
  overflow-wrap: anywhere;
}
</style>
