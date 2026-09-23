<template>
  <section class="sidebar-section api-key-section">
    <div class="sidebar-section-title f-m">MCP API Keys</div>

    <AsyncGate :status="status">
      <template #loading>
        <div class="api-key-list">
          <BaseSkeleton
            v-for="index in 1"
            :key="index"
            height="var(--api-key-card-height)"
            radius="var(--radius-md)"
          />
        </div>
      </template>

      <div v-if="activeKeys.length" class="api-key-list">
        <BaseDeletableCard
          v-for="apiKey in activeKeys"
          :key="apiKey.id"
          class="api-key-card"
          delete-label="Revoke API key"
          tooltip-placement="right"
          :disabled="revokingKeyId === apiKey.id"
          @delete="openRevokeModal(apiKey)"
        >
          <div class="api-key-copy">
            <span class="f-s fw-bold">{{ apiKey.name }}</span>
            <span class="f-xs fc-sec">{{ apiKey.prefix }}...</span>
            <span class="f-xs fc-sec">
              <span class="fw-bold">Created at:</span>
              {{ apiKey.created_at }}
            </span>
            <span class="f-xs fc-sec">
              <span class="fw-bold">Last used:</span>
              {{ apiKey.last_used_at ?? "-" }}
            </span>
            <div class="api-key-tags">
              <span
                v-for="permission in apiKey.permissions"
                :key="permission"
                class="meta-tag f-xs"
              >
                {{ permission }}
              </span>
            </div>
          </div>
        </BaseDeletableCard>
      </div>
    </AsyncGate>

    <BaseTooltip
      text="Create API key"
      placement="right"
      block
      class="api-key-create-control"
    >
      <GhostButton
        class="api-key-create-button"
        aria-label="Create MCP API key"
        :disabled="isLoading"
        @click="showCreateModal = true"
      >
        <div class="api-key-create-plus">
          <component class="api-key-create-plus" :is="PlusIcon" />
        </div>
      </GhostButton>
    </BaseTooltip>

    <ApiKeyModal
      v-model="showCreateModal"
      :pending="isCreating"
      :created-key="createdKey"
      @create="createKey"
    />

    <RevokeApiKeyModal
      v-model="showRevokeModal"
      :api-key="revokeTarget"
      :pending="Boolean(revokingKeyId)"
      @confirm="revokeKey"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  createApiKeyApi,
  getApiKeysApi,
  revokeApiKeyApi,
} from '@/api/api-key'
import type {
  ApiKeyCreateRequest,
  ApiKeyInfo,
} from '@/types/api-key'
import type { AsyncStatus } from '@/types/async'
import { useToastStore } from '@/stores/toast'
import { normalizeRequestError } from '@/utils/request'

import AsyncGate from '@/components/base/AsyncGate.vue'
import BaseDeletableCard from '@/components/base/BaseDeletableCard.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import BaseTooltip from '@/components/base/BaseTooltip.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import ApiKeyModal from '@/components/overlay/modals/ApiKeyModal.vue'
import RevokeApiKeyModal from '@/components/overlay/modals/RevokeApiKeyModal.vue'
import PlusIcon from '@/assets/icons/plus.svg'

const toastStore = useToastStore()
const apiKeys = ref<ApiKeyInfo[]>([])
const status = ref<AsyncStatus>('idle')
const showCreateModal = ref(false)
const showRevokeModal = ref(false)
const isCreating = ref(false)
const revokingKeyId = ref<string | null>(null)
const revokeTarget = ref<ApiKeyInfo | null>(null)
const createdKey = ref('')

const activeKeys = computed(() => apiKeys.value.filter((item) => item.is_active))
const isLoading = computed(() => status.value === 'loading')

const loadKeys = async () => {
  status.value = apiKeys.value.length ? 'refreshing' : 'loading'
  try {
    const response = await getApiKeysApi()
    apiKeys.value = response.data
    status.value = 'ready'
  } catch (error) {
    status.value = 'error'
    throw error
  }
}

const createKey = async (payload: ApiKeyCreateRequest) => {
  if (isCreating.value) {
    return
  }
  isCreating.value = true
  try {
    const response = await createApiKeyApi(payload)
    apiKeys.value.push(response.data)
    createdKey.value = response.data.key
    toastStore.pushNotice('info', 'API key created.')
  } catch (error) {
    const requestError = normalizeRequestError(error)
    toastStore.pushNotice('error', `Failed to create API key: ${requestError.message}`)
  } finally {
    isCreating.value = false
  }
}

const openRevokeModal = (apiKey: ApiKeyInfo) => {
  revokeTarget.value = apiKey
  showRevokeModal.value = true
}

const revokeKey = async (keyId: string) => {
  if (revokingKeyId.value) {
    return
  }
  revokingKeyId.value = keyId
  try {
    await revokeApiKeyApi(keyId)
    apiKeys.value = apiKeys.value.map((item) => {
      return item.id === keyId ? { ...item, is_active: false } : item
    })
    showRevokeModal.value = false
    toastStore.pushNotice('info', 'API key revoked.')
  } catch (error) {
    const requestError = normalizeRequestError(error)
    toastStore.pushNotice('error', `Failed to revoke API key: ${requestError.message}`)
  } finally {
    revokingKeyId.value = null
  }
}

onMounted(() => {
  void loadKeys()
})

watch(showCreateModal, (visible) => {
  if (!visible) {
    createdKey.value = ''
  }
})
</script>

<style scoped>
.api-key-section {
  min-width: 0;
}

.api-key-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.api-key-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.api-key-create-control {
  margin-top: var(--space-sm);
}

.api-key-create-button {
  width: 100%;
}

.api-key-create-button :deep(svg) {
  width: var(--api-key-create-icon-size);
  height: var(--api-key-create-icon-size);
  fill: currentColor;
}

.api-key-create-plus {
  width: var(--icon-button-sm-size);
  height: var(--icon-button-sm-size);
  max-width: var(--icon-button-sm-size);
  max-height: var(--icon-button-sm-size);
  min-width: var(--icon-button-sm-size);
  min-height: var(--icon-button-sm-size);
  align-items: center;
  justify-content: center;
  fill: var(--color-text-pri);
}

.api-key-card {
  width: 100%;
  padding: var(--space-md);
  border-radius: var(--radius-lg);
}

.api-key-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: var(--space-xs);
}

.api-key-copy > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
