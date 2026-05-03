<template>
  <div class="d-flex flex-column h-100">
    <BaseHeader>
      <div class="f-m fw-bold text-uppercase">Settings</div>
    </BaseHeader>

    <div class="settings-body container-fluid flex-grow-1 overflow-y-scroll p-0 my-3">

      <div class="text-uppercase fw-bold mb-2 f-m fc-pri">Appearance</div>

      <section class="mb-4">
          <SidebarSettingTheme />
      </section>

      <div class="text-uppercase fw-bold mb-2 f-m fc-pri">General</div>

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

    <div class="settings-footer horizontal-line-top flex-shrink-0 py-3">
      <div class="settings-footer-row d-flex justify-content-between align-items-center mb-1 f-s fc-pri">
        <span class="text-uppercase f-s">App Version:</span>
        <div class="settings-footer-value-slot">
          <AsyncGate :status="sysStore.sysStatusState" class="settings-footer-gate">
            <template #loading>
              <BaseSkeleton width="72px" height="var(--meta-tag-height)" radius="4px" />
            </template>

            <span class="meta-tag settings-footer-tag">v{{ sysStore.version }}</span>
          </AsyncGate>
        </div>
      </div>

      <div class="settings-footer-row d-flex justify-content-between align-items-center f-s fc-pri">
        <span class="text-uppercase f-s">System Status:</span>
        <div class="settings-footer-value-slot">
          <AsyncGate :status="sysStore.sysStatusState" class="settings-footer-gate">
            <template #loading>
              <BaseSkeleton width="88px" height="var(--meta-tag-height)" radius="4px" />
            </template>

            <span class="meta-tag settings-footer-tag">{{ sysStore.status }}</span>
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
import SidebarSettingTheme from '@/components/sidebar/SidebarSettingTheme.vue';

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

.settings-footer-row {
  min-height: var(--meta-tag-height);
}

.settings-footer-value-slot {
  min-width: var(--settings-footer-value-min-width);
  min-height: var(--meta-tag-height);
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

.settings-footer-gate {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-height: var(--meta-tag-height);
}

.settings-footer-tag {
  min-height: var(--meta-tag-height);
  height: var(--meta-tag-height);
}

.setting-skeleton-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--settings-skeleton-gap);
  padding-bottom: var(--settings-skeleton-padding-bottom);
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
