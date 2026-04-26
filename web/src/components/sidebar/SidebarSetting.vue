<template>
  <div class="d-flex flex-column h-100">
    <BaseHeader>
      <div class="f-m fw-bold text-uppercase">Settings</div>
    </BaseHeader>

    <div class="container-fluid flex-grow-1 overflow-y-scroll py-2 settings-body">
      <AsyncGate :status="sysStore.settingsState">
        <template #loading>
          <section class="mb-5">
            <div v-for="index in 4" :key="index" class="setting-skeleton-row">
              <div class="setting-skeleton-text">
                <BaseSkeleton width="46%" height="0.85rem" class="setting-skeleton-line" />
                <BaseSkeleton height="0.7rem" class="setting-skeleton-line" />
              </div>
              <BaseSkeleton width="120px" height="1.8rem" radius="6px" />
            </div>
          </section>
        </template>

        <section v-if="sysStore.currentSettings.length > 0" class="mb-5">
          <SidebarSettingItem
            v-for="item in sysStore.currentSettings"
            :key="item.id"
            :setting="item"
            :pending="sysStore.isSettingUpdating(item.id)"
            @update="handleUpdateSetting"
          />
        </section>
      </AsyncGate>
    </div>

    <div class="p-3 border-top bg-white flex-shrink-0 settings-footer">
      <div class="d-flex justify-content-between align-items-center text-muted small mb-1">
        <span class="text-uppercase f-s">App Version:</span>
        <div class="settings-footer-value-slot">
          <AsyncGate tag="span" :status="sysStore.sysStatusState">
            <template #loading>
              <BaseSkeleton width="72px" height="1rem" />
            </template>

            <span class="meta-tag">v{{ sysStore.version }}</span>
          </AsyncGate>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center text-muted small">
        <span class="text-uppercase f-s">System Status:</span>
        <div class="settings-footer-value-slot">
          <AsyncGate tag="span" :status="sysStore.sysStatusState">
            <template #loading>
              <BaseSkeleton width="88px" height="1rem" />
            </template>

            <span class="meta-tag">{{ sysStore.status }}</span>
          </AsyncGate>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSysStore } from '@/stores/system';

import AsyncGate from '@/components/base/AsyncGate.vue';
import BaseHeader from '@/components/base/BaseHeader.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import SidebarSettingItem from '@/components/sidebar/SidebarSettingItem.vue';

const sysStore = useSysStore()

onMounted(async () => {
  await Promise.allSettled([
    sysStore.refreshSysStatus(),
    sysStore.refreshSystemSettings(),
  ])
})

const handleUpdateSetting = async (id: string, newValue: string | boolean) => {
  await sysStore.updateSystemSetting(id, newValue)
}
</script>

<style scoped>
.settings-body {
  min-height: 0;
}

.settings-footer {
  margin-top: auto;
}

.settings-footer-value-slot {
  min-width: 88px;
  min-height: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

.setting-skeleton-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-bottom: 14px;
}

.setting-skeleton-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-skeleton-line {
  flex-shrink: 0;
}
</style>
