<template>
  <BaseModal
    v-model="isVisible"
    :title="title"
    @opened="handleOpened"
  >
    <div class="create-node-modal">
      <UnderlinedInput
        v-model="nodeName"
        :label="inputLabel"
        ref="inputRef"
        type="text"
        class="mb-2 f-s"
        :disabled="isPending"
        :placeholder="placeholder"
        @keyup.enter="handleConfirm"
      />

      <BaseIconText :icon="InfoIcon" :text="hint" class="mb-3" />

      <div class="d-flex justify-content-end gap-2">
        <GhostButton
          class="f-s py-0"
          @click="isVisible = false"
          theme="secondary"
          :disabled="isPending"
        >
          Cancel
        </GhostButton>
        <GhostButton
          class="f-s py-0"
          @click="handleConfirm"
          :disabled="!nodeName.trim() || isPending"
          :loading="isPending"
        >
          Create
        </GhostButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import BaseIconText from '@/components/base/BaseIconText.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import UnderlinedInput from '@/components/base/UnderlinedInput.vue'
import InfoIcon from '@/assets/icons/info.svg'
import { useNodeStore } from '@/stores/note'

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

const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

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

<style scoped>
.create-node-modal {
  width: var(--modal-width-sm);
}
</style>
