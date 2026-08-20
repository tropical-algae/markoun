<template>
  <BaseModal v-model="isVisible" title="Delete Revision">
    <ModalContentLayout class="delete-history-modal fc-pri">
      <p>{{ summary }}</p>
      <p class="f-s fc-sec">This action cannot be undone.</p>

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
          :disabled="pending"
          :loading="pending"
          @click="confirmDelete"
        >
          Delete
        </GhostButton>
      </template>
    </ModalContentLayout>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HistoryNode, HistoryTree } from '@/types/history'
import BaseModal from '@/components/base/BaseModal.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import ModalContentLayout from '@/layouts/ModalContentLayout.vue'

const props = defineProps<{
  modelValue: boolean
  node: HistoryNode | null
  tree: HistoryTree | null
  pending: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'confirm', revisionId: string): void
}>()

const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const getDescendantCount = (rootId: string, children: Map<string, string[]>): number => {
  const visited = new Set<string>()
  const pending = [rootId]
  while (pending.length > 0) {
    const current = pending.pop()
    if (!current || visited.has(current)) {
      continue
    }
    visited.add(current)
    pending.push(...(children.get(current) ?? []))
  }
  return visited.size
}

const isAncestorOfDefault = computed(() => {
  if (!props.node || !props.tree?.default_revision_id) {
    return false
  }
  const byId = new Map(props.tree.nodes.map((node) => [node.id, node]))
  let currentId: string | null = props.tree.default_revision_id
  while (currentId) {
    if (currentId === props.node.id) {
      return true
    }
    currentId = byId.get(currentId)?.parent_id ?? null
  }
  return false
})

const summary = computed(() => {
  if (!props.node || !props.tree) {
    return 'Delete this revision?'
  }
  const children = new Map<string, string[]>()
  for (const node of props.tree.nodes) {
    if (node.parent_id) {
      children.set(node.parent_id, [...(children.get(node.parent_id) ?? []), node.id])
    }
  }
  const count = getDescendantCount(props.node.id, children)
  const label = `Revision ${props.node.sequence}`
  const descendantLabel = count === 1
    ? ''
    : ` and ${count - 1} descendant revision${count === 2 ? '' : 's'}`

  if (isAncestorOfDefault.value) {
    if (!props.node.parent_id) {
      return `${label}${descendantLabel} will be deleted. The file will keep its current content without history.`
    }
    return `${label}${descendantLabel} will be deleted. The file will return to its parent revision.`
  }
  return `${label}${descendantLabel} will be deleted.`
})

const confirmDelete = () => {
  if (props.node) {
    emit('confirm', props.node.id)
  }
}
</script>

<style scoped>
.delete-history-modal {
  width: var(--modal-width-sm);
  max-width: 100%;
}

.delete-history-modal p {
  overflow-wrap: anywhere;
}
</style>
