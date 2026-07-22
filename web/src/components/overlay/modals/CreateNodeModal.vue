<template>
  <BaseModal
    v-model="isVisible"
    :title="title"
    @opened="handleOpened"
  >
    <form @submit.prevent="handleConfirm">
      <ModalContentLayout>
        <UnderlinedInput
          v-model="nodeName"
          :label="inputLabel"
          ref="inputRef"
          type="text"
          name="node_name"
          autocomplete="off"
          class="modal-field f-s"
          :disabled="isPending"
          :placeholder="placeholder"
        />

        <BaseIconText
          :icon="InfoIcon"
          :text="hint"
          class="modal-hint"
          color="var(--color-text-muted)"
        />

        <template #actions>
          <GhostButton
            type="button"
            class="modal-button f-s"
            @click="isVisible = false"
            theme="secondary"
            :disabled="isPending"
          >
            Cancel
          </GhostButton>
          <GhostButton
            type="submit"
            class="modal-button f-s"
            :disabled="!nodeName.trim() || isPending"
            :loading="isPending"
          >
            Create
          </GhostButton>
        </template>
      </ModalContentLayout>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import BaseIconText from '@/components/base/BaseIconText.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import UnderlinedInput from '@/components/base/UnderlinedInput.vue'
import ModalContentLayout from '@/layouts/ModalContentLayout.vue'
import InfoIcon from '@/assets/icons/info.svg'
import { useNodeStore } from '@/stores/note'
import { useModelProxy } from '@/composables/useModelProxy'

const props = defineProps<{
  modelValue: boolean
  title: string
  inputLabel: string
  placeholder: string
  hint: string
  nodeType: 'file' | 'dir'
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const nodeStore = useNodeStore()
const nodeName = ref('')
const inputRef = ref<InstanceType<typeof UnderlinedInput> | null>(null)

const isVisible = useModelProxy(props, emit)
const isPending = computed(() => nodeStore.isCreatePending(props.nodeType))

const handleOpened = () => {
  inputRef.value?.focus()
}

const handleConfirm = async () => {
  const nextName = nodeName.value.trim()
  if (!nextName || isPending.value) {
    return
  }

  await nodeStore.addNewNode(nextName, props.nodeType)
  isVisible.value = false
  nodeName.value = ''
}
</script>
