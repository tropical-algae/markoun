<template>
  <BaseModal
    v-model="isVisible"
    :title="createdKey ? 'API Key Created' : 'Create MCP API Key'"
    :close-on-backdrop="!pending"
    :close-on-escape="!pending"
    @opened="handleOpened"
  >
    <ModalContentLayout>
      <template v-if="createdKey">
        <p class="api-key-warning f-s fc-sec">
          Copy this key now. It will not be shown again.
        </p>
        <div class="api-key-result">
          <div class="api-key-result-item">
            <span class="f-xs fw-bold fc-pri">Server URL</span>
            <code class="api-key-result-value f-xs">{{ mcpServerUrl }}</code>
          </div>
          <div class="api-key-result-item">
            <span class="f-xs fw-bold fc-pri">API Key</span>
            <code class="api-key-result-value f-xs">{{ createdKey }}</code>
          </div>
        </div>
      </template>

      <form v-else :id="createFormId" @submit.prevent="handleCreate">
        <UnderlinedInput
          v-model="keyName"
          ref="nameInputRef"
          label="Key name"
          name="api_key_name"
          autocomplete="off"
          class="modal-field f-s"
          placeholder="Agent name"
          :disabled="pending"
        />

        <fieldset class="api-key-permissions" :disabled="pending">
          <legend class="f-s fw-bold fc-pri">Permissions</legend>
          <div class="api-key-permission-grid">
            <label
              v-for="permission in permissionOptions"
              :key="permission"
              class="choice-control f-s"
              :class="{ 'is-disabled': pending }"
            >
              <input
                v-model="selectedPermissions"
                class="choice-input"
                type="checkbox"
                :value="permission"
              >
              <span class="choice-box"></span>
              <span class="api-key-permission-label">{{ permission }}</span>
            </label>
          </div>
        </fieldset>

      </form>

      <template #actions>
        <template v-if="createdKey">
          <GhostButton
            class="modal-button f-s"
            theme="secondary"
            @click="copyKey"
          >
            Copy Key
          </GhostButton>
          <GhostButton
            class="modal-button f-s"
            @click="isVisible = false"
          >
            Close
          </GhostButton>
        </template>
        <template v-else>
          <GhostButton
            type="button"
            class="modal-button f-s"
            theme="secondary"
            :disabled="pending"
            @click="isVisible = false"
          >
            Cancel
          </GhostButton>
          <GhostButton
            type="submit"
            :form="createFormId"
            class="modal-button f-s"
            :disabled="!canCreate"
            :loading="pending"
          >
            Create
          </GhostButton>
        </template>
      </template>
    </ModalContentLayout>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { useToastStore } from '@/stores/toast'
import { resolveAbsoluteApiUrl } from '@/utils/api-url'
import {
  McpPermission,
  type ApiKeyCreateRequest,
} from '@/types/api-key'

import BaseModal from '@/components/base/BaseModal.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import UnderlinedInput from '@/components/base/UnderlinedInput.vue'
import ModalContentLayout from '@/layouts/ModalContentLayout.vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  pending?: boolean
  createdKey?: string
}>(), {
  pending: false,
  createdKey: '',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'create', payload: ApiKeyCreateRequest): void
}>()

const permissionOptions = Object.values(McpPermission)
const toastStore = useToastStore()
const createFormId = useId()
const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})
const nameInputRef = ref<InstanceType<typeof UnderlinedInput> | null>(null)
const keyName = ref('')
const selectedPermissions = ref<McpPermission[]>([...permissionOptions])
const mcpServerUrl = resolveAbsoluteApiUrl('/mcp')

const canCreate = computed(() => {
  return Boolean(keyName.value.trim() && selectedPermissions.value.length) && !props.pending
})

const resetForm = () => {
  keyName.value = ''
  selectedPermissions.value = [...permissionOptions]
}

const handleOpened = async () => {
  if (props.createdKey) {
    return
  }
  await nextTick()
  nameInputRef.value?.focus()
}

const handleCreate = () => {
  if (!canCreate.value) {
    return
  }
  emit('create', {
    name: keyName.value.trim(),
    permissions: [...selectedPermissions.value],
  })
}

const copyKey = async () => {
  await navigator.clipboard.writeText(props.createdKey)
  toastStore.pushNotice('info', 'API key copied.')
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      resetForm()
    }
  },
)
</script>

<style scoped>
.api-key-permissions {
  margin: 0;
  padding: 0;
  border: 0;
}

.api-key-permissions legend {
  margin-bottom: var(--space-sm);
  padding: 0;
}

.api-key-permission-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-sm) var(--space-lg);
}

.api-key-permission-label {
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: capitalize;
  white-space: nowrap;
}

.api-key-warning {
  margin: 0 0 var(--space-lg);
}

.api-key-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.api-key-result-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.api-key-result-value {
  display: block;
  width: var(--api-key-secret-width);
  max-width: 100%;
  padding: var(--space-sm);
  margin: 0;
  overflow-wrap: anywhere;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-field);
  color: var(--color-text-pri);
  box-sizing: border-box;
  user-select: text;
}
</style>
