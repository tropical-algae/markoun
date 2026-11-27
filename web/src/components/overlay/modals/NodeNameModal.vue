<template>
  <BaseModal
    v-model="isVisible"
    :title="title"
    :close-on-backdrop="!isPending"
    :close-on-escape="!isPending"
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
            :disabled="!canSubmit"
            :loading="isPending"
          >
            {{ isRename ? 'Rename' : 'Create' }}
          </GhostButton>
        </template>
      </ModalContentLayout>
    </form>
  </BaseModal>
</template>

<script lang="ts">
import type { FsNode } from '@/types/file-system'

export type NodeNameOperation =
  | { kind: 'create', nodeType: FsNode['type'], parentPath: string }
  | { kind: 'rename', target: FsNode }
</script>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import BaseIconText from '@/components/base/BaseIconText.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import UnderlinedInput from '@/components/base/UnderlinedInput.vue'
import ModalContentLayout from '@/layouts/ModalContentLayout.vue'
import InfoIcon from '@/assets/icons/info.svg'
import { useWorkspaceActions } from '@/composables/useWorkspaceActions'
import { useModelProxy } from '@/composables/useModelProxy'
import { displayDirectoryPath } from '@/utils/file-system'

const props = defineProps<{
  modelValue: boolean
  operation: NodeNameOperation | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const workspace = useWorkspaceActions()
const nodeName = ref('')
const inputRef = ref<InstanceType<typeof UnderlinedInput> | null>(null)
const isVisible = useModelProxy(props, emit)
const isPending = ref(false)
const isRename = computed(() => props.operation?.kind === 'rename')
const itemLabel = computed(() => {
  const operation = props.operation
  if (operation?.kind === 'rename') {
    return operation.target.type === 'dir' ? 'Folder' : 'File'
  }
  return operation?.nodeType === 'dir' ? 'Folder' : 'Note'
})
const title = computed(() => `${isRename.value ? 'Rename' : 'New'} ${itemLabel.value}`)
const inputLabel = computed(() => `${itemLabel.value} Name`)
const hint = computed(() => {
  const operation = props.operation
  if (!operation) return ''
  if (operation.kind === 'rename') {
    return operation.target.suffix
      ? `Renaming ${operation.target.path}. The extension is kept.`
      : `Renaming ${operation.target.path}.`
  }
  const location = `Create in: ${displayDirectoryPath(operation.parentPath)}`
  return operation.nodeType === 'file' ? `${location} (no extension needed)` : location
})
const canSubmit = computed(() => {
  const operation = props.operation
  const name = nodeName.value.trim()
  return Boolean(operation && name && !isPending.value
    && (operation.kind === 'create' || name !== operation.target.name))
})

watch(isVisible, (visible) => {
  if (visible) {
    nodeName.value = props.operation?.kind === 'rename' ? props.operation.target.name : ''
  }
})

const handleOpened = async () => {
  await nextTick()
  inputRef.value?.focus()
  if (isRename.value) {
    inputRef.value?.select()
  }
}

const handleConfirm = async () => {
  const operation = props.operation
  if (!operation || !canSubmit.value) return
  const name = nodeName.value.trim()

  isPending.value = true
  try {
    if (operation.kind === 'rename') {
      await workspace.renameNode(operation.target, name)
    } else {
      await workspace.createNode(name, operation.nodeType, operation.parentPath)
    }
    isVisible.value = false
  } catch {
    // The request handler reports failures; keep the form open for correction.
  } finally {
    isPending.value = false
  }
}
</script>
