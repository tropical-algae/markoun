<template>
  <div class="d-flex flex-column h-100">

    <BaseHeader>
      <div class="f-l fw-bold">Settings</div>
    </BaseHeader>

    <div class="container-fluid flex-grow-1 overflow-y-scroll py-2 settings-body">
      
      <section class="mb-5">
        <div class="text-uppercase fw-bold mb-3 f-m">Account</div>

        <div class="mb-3">
          <UnderlinedInput
            v-model="pwdForm.new"
            label="New password"
            ref="inputRef"
            type="password"
            class="mb-3 f-s"
            placeholder="Enter new password"
          />
          <UnderlinedInput
            v-model="pwdForm.confirm"
            label="Confirm password"
            ref="inputRef"
            type="password"
            class="mb-1 f-s"
            placeholder="Confirm password"
          />

          <BaseIconText 
            :icon="InfoIcon" 
            :text="isPwdLenValid ? 'Password do not match.' : 'Password must be longer than 6.'" 
            color="var(--color-bg-error)"
            style="transition: opacity 0.2s;"
            :style="{ opacity: (pwdForm.new && pwdForm.confirm) && (!isPwdLenValid || !isPwdConfValid) ? 1 : 0 }"
          />
        </div>

        <GhostButton 
          class="w-100 f-s"
          :disabled="!isPwdLenValid || !isPwdConfValid || uesrStore.isUpdatePasswordPending()"
          :loading="uesrStore.isUpdatePasswordPending()"
          @click="handleUpdatePassword"
        >
          Update Password
        </GhostButton>

      </section>

      <Transition name="soft-swap" mode="out-in">
        <section v-if="showSettingsSkeleton" key="settings-skeleton" class="mb-5">
          <div class="text-uppercase fw-bold mb-3 f-m">Preferences</div>
          <div v-for="index in 4" :key="index" class="setting-skeleton-row">
            <div class="setting-skeleton-text">
              <BaseSkeleton width="46%" height="0.85rem" class="setting-skeleton-line" />
              <BaseSkeleton height="0.7rem" class="setting-skeleton-line" />
            </div>
            <BaseSkeleton width="120px" height="1.8rem" radius="6px" />
          </div>
        </section>
        <section v-else-if="sysStore.currentSettings.length > 0" class="mb-5" key="settings-list">
          <div class="text-uppercase fw-bold mb-3 f-m">Preferences</div>
          <SidebarSettingItem
            v-for="item in sysStore.currentSettings"
            :key="item.id"
            :setting="item"
            :pending="sysStore.isSettingUpdating(item.id)"
            @update="handleUpdateSetting"
          />
        </section>
      </Transition>

    </div>

    <div class="p-3 border-top bg-white flex-shrink-0 settings-footer">
      
      <div class="d-flex justify-content-between align-items-center text-muted small mb-1">
        <span>App Version:</span>
        <div class="settings-footer-value-slot">
          <Transition name="soft-swap" mode="out-in">
            <BaseSkeleton
              v-if="sysStore.sysStatusState === 'loading'"
              key="version-skeleton"
              width="72px"
              height="1rem"
            />
            <span v-else key="version-value" class="meta-tag">v{{ sysStore.version }}</span>
          </Transition>
        </div>
      </div>
      
      <div class="d-flex justify-content-between align-items-center text-muted small mb-3">
        <span>System Status:</span>
        <div class="settings-footer-value-slot">
          <Transition name="soft-swap" mode="out-in">
            <BaseSkeleton
              v-if="sysStore.sysStatusState === 'loading'"
              key="status-skeleton"
              width="88px"
              height="1rem"
            />
            <span v-else key="status-value" class="meta-tag">{{ sysStore.status }}</span>
          </Transition>
        </div>
      </div>

      <GhostButton
        @click="handleLogout"
        class="w-100 f-s"
        theme="danger"
        :loading="uesrStore.isLogoutPending()"
        :disabled="uesrStore.isLogoutPending()"
      >
        Logout
      </GhostButton>
      
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted } from 'vue';
import { useSysStore } from '@/stores/system';
import { useUserStore } from '@/stores/user';

import router from '@/router';

import BaseHeader from '@/components/base/BaseHeader.vue';
import BaseIconText from '@/components/base/BaseIconText.vue';
import GhostButton from '@/components/base/GhostButton.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import UnderlinedInput from '@/components/base/UnderlinedInput.vue';
import SidebarSettingItem from '@/components/sidebar/SidebarSettingItem.vue';

import InfoIcon from "@/assets/icons/info.svg"


const sysStore = useSysStore()
const uesrStore = useUserStore()
const showSettingsSkeleton = computed(() => {
  return sysStore.settingsState === 'loading' && sysStore.currentSettings.length === 0
})


onMounted(async () => {
  await Promise.allSettled([
    sysStore.refreshSysStatus(),
    sysStore.refreshSystemSettings(),
  ])
})


const pwdForm = reactive({
  new: '',
  confirm: ''
});
const isPwdLenValid = computed(() => pwdForm.new.length >= 6 )
const isPwdConfValid = computed(() => pwdForm.new === pwdForm.confirm )

const handleLogout = async () => {
  const isDone = await uesrStore.logout()
  if (isDone) {
    await router.replace({ name: 'Login' })
  }
}

const handleUpdatePassword = async () => {
  const isDone = await uesrStore.updatePassword(pwdForm.new);
  if (isDone) {
    await handleLogout();
  }
};

const handleUpdateSetting = async (id: string, newValue: string | boolean) => {
  await sysStore.updateSystemSetting(id, newValue);
};

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
