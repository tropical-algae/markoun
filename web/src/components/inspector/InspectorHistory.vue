<template>
  <InspectorPanel
    title="History"
    body-class="history-panel-body"
    :status="nodeStore.historyTreeStatus"
    :show-delay-ms="showDelayMs"
    :is-empty="isEmpty"
    :loading-on-refreshing="false"
    @close="emit('close')"
  >
    <template #loading>
      <div class="history-skeleton-list">
        <BaseSkeleton
          v-for="index in 3"
          :key="index"
          width="var(--history-node-width)"
          height="var(--history-node-height)"
          class="history-node-skeleton"
        />
      </div>
    </template>

    <template #empty>
      <div class="history-message f-s fc-sec">
        Save this note to create its first revision.
      </div>
    </template>

    <template #error>
      <div class="history-message">
        <span class="f-s fc-sec">History could not be loaded.</span>
        <GhostButton class="f-s" theme="secondary" @click="retryLoad">
          Retry
        </GhostButton>
      </div>
    </template>

    <HistoryCanvas
      v-if="nodeStore.historyTree"
      :tree="nodeStore.historyTree"
      :selected-revision-id="nodeStore.viewedRevisionId"
      :default-revision-id="nodeStore.defaultRevisionId"
      :pending-revision-id="nodeStore.pendingRevisionId"
      :disabled="interactionPending"
      @select="selectRevision"
      @delete="openDeleteModal"
    />
  </InspectorPanel>

  <DeleteHistoryRevisionModal
    v-model="deleteModalVisible"
    :node="deleteTarget"
    :tree="nodeStore.historyTree"
    :pending="nodeStore.isHistoryDeletePending()"
    @confirm="deleteRevision"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { HistoryNode } from '@/types/history'
import { useNodeStore } from '@/stores/note'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import InspectorPanel from '@/components/inspector/InspectorPanel.vue'
import HistoryCanvas from '@/components/inspector/HistoryCanvas.vue'
import DeleteHistoryRevisionModal from '@/components/overlay/modals/DeleteHistoryRevisionModal.vue'

defineProps<{
  showDelayMs: number
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const nodeStore = useNodeStore()
const deleteModalVisible = ref(false)
const deleteTarget = ref<HistoryNode | null>(null)
const isEmpty = computed(() => {
  return nodeStore.historyTreeStatus === 'ready'
    && (nodeStore.historyTree?.nodes.length ?? 0) === 0
})
const interactionPending = computed(() => {
  return nodeStore.isHistoryRevisionPending()
    || nodeStore.isHistoryDeletePending()
    || nodeStore.isSavePending()
})

const retryLoad = () => {
  void nodeStore.loadHistoryTree().catch(() => null)
}

const selectRevision = (revisionId: string) => {
  void nodeStore.selectHistoryRevision(revisionId).catch(() => null)
}

const openDeleteModal = async (node: HistoryNode) => {
  try {
    await nodeStore.prepareHistoryRevisionDelete()
    const currentNode = nodeStore.historyTree?.nodes.find((item) => item.id === node.id)
    if (currentNode) {
      deleteTarget.value = currentNode
      deleteModalVisible.value = true
    }
  } catch (_) {
    // Saving or refreshing failed; deletion must not proceed with stale tree data.
  }
}

const deleteRevision = async (revisionId: string) => {
  try {
    await nodeStore.deleteHistoryRevision(revisionId)
    deleteModalVisible.value = false
    deleteTarget.value = null
  } catch (_) {
    // The global request handler presents the failure while the modal remains open.
  }
}

watch(
  [
    () => nodeStore.currentFile.path,
    () => nodeStore.currentFileStatus,
    () => nodeStore.historyEnabled,
  ],
  ([path, status, enabled]) => {
    if (path && status === 'ready' && enabled) {
      void nodeStore.loadHistoryTree().catch(() => null)
    }
  },
  { immediate: true },
)

watch(() => nodeStore.currentFile.path, () => {
  deleteModalVisible.value = false
  deleteTarget.value = null
})
</script>

<style scoped>
:deep(.history-panel-body) {
  overflow: hidden;
  content-visibility: visible;
}

.history-skeleton-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--history-tree-gap-y);
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.history-node-skeleton {
  flex: 0 0 auto;
  max-width: 100%;
}

.history-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: var(--space-xl);
  gap: var(--space-md);
  text-align: center;
  box-sizing: border-box;
}
</style>
