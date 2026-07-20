<template>
  <SidebarPanelLayout class="settings-sidebar" title="Settings">
    <div class="settings-body sidebar-panel-body">
      <div class="sidebar-section-title f-m">Appearance</div>

      <section class="sidebar-section">
        <SidebarSettingAppearance />
      </section>

      <div class="sidebar-section-title f-m">General</div>

      <AsyncGate :status="sysStore.settingsState">
        <template #loading>
          <section class="settings-list-section">
            <div v-for="index in 4" :key="index" class="setting-skeleton-row">
              <div class="setting-skeleton-text">
                <BaseSkeleton
                  width="var(--settings-skeleton-title-width)"
                  height="var(--settings-skeleton-title-height)"
                  class="setting-skeleton-line"
                />
                <BaseSkeleton
                  height="var(--settings-skeleton-desc-height)"
                  class="setting-skeleton-line"
                />
              </div>
              <BaseSkeleton
                width="var(--setting-text-input-width)"
                height="var(--settings-skeleton-control-height)"
                radius="var(--setting-text-input-radius)"
              />
            </div>
          </section>
        </template>

        <section v-if="sysStore.currentSettings.length > 0" class="settings-list-section">
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

    <template #footer>
      <div class="settings-footer sidebar-panel-footer horizontal-line-top">
        <div class="settings-footer-row f-s fc-pri">
          <span class="text-uppercase f-s">App Version:</span>
          <div class="settings-footer-value-slot">
            <AsyncGate :status="sysStore.sysStatusState" class="settings-footer-gate">
              <template #loading>
                <BaseSkeleton
                  width="var(--settings-footer-version-skeleton-width)"
                  height="var(--meta-tag-height)"
                  radius="var(--settings-footer-skeleton-radius)"
                />
              </template>

              <span class="meta-tag settings-footer-tag">v{{ sysStore.version }}</span>
            </AsyncGate>
          </div>
        </div>

        <div class="settings-footer-row f-s fc-pri">
          <span class="text-uppercase f-s">System Status:</span>
          <div class="settings-footer-value-slot">
            <AsyncGate :status="sysStore.sysStatusState" class="settings-footer-gate">
              <template #loading>
                <BaseSkeleton
                  width="var(--settings-footer-status-skeleton-width)"
                  height="var(--meta-tag-height)"
                  radius="var(--settings-footer-skeleton-radius)"
                />
              </template>

              <span class="meta-tag settings-footer-tag">{{ sysStore.status }}</span>
            </AsyncGate>
          </div>
        </div>
      </div>
    </template>
  </SidebarPanelLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSysStore } from '@/stores/system'

import AsyncGate from '@/components/base/AsyncGate.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import SidebarSettingItem from '@/components/sidebar/SidebarSettingItem.vue'
import SidebarSettingAppearance from '@/components/sidebar/SidebarSettingAppearance.vue'
import SidebarPanelLayout from '@/layouts/SidebarPanelLayout.vue'

const sysStore = useSysStore()

onMounted(async () => {
  await Promise.allSettled([
    sysStore.ensureSysStatus(),
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

.settings-list-section {
  margin-bottom: calc(
    var(--sidebar-section-margin-bottom) +
    var(--sidebar-settings-list-extra-gap)
  );
}

.settings-footer {
  margin-top: auto;
}

.settings-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--meta-tag-height);
}

.settings-footer-row + .settings-footer-row {
  margin-top: var(--sidebar-footer-row-gap);
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
  gap: var(--settings-skeleton-text-gap);
}

.setting-skeleton-line {
  flex-shrink: 0;
}
</style>
