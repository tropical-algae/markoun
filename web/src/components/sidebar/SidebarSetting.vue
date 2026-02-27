<template>
  <div class="d-flex flex-column h-100">

    <BaseHeader>
      <div class="f-l fw-bold">Settings</div>
    </BaseHeader>

    <div class="container-fluid flex-grow-1 overflow-y-scroll py-2">
      
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
          :disabled="!isPwdLenValid || !isPwdConfValid || isSavingPwd"
          @click="handleUpdatePassword"
        >
          Update Password
        </GhostButton>

      </section>

      <section class="mb-5" v-if="sysStore.currentSettings.length > 0">
        <div class="text-uppercase fw-bold mb-3 f-m">Preferences</div>
        <SidebarSettingItem
          v-for="item in sysStore.currentSettings"
          :key="item.id"
          :setting="item"
          @update="handleUpdateSetting"
        />
      </section>

    </div>

    <div class="p-3 border-top bg-white flex-shrink-0">
      
      <div class="d-flex justify-content-between align-items-center text-muted small mb-1">
        <span>App Version:</span>
        <span class="meta-tag">v{{ sysStore.version }}</span>
      </div>
      
      <div class="d-flex justify-content-between align-items-center text-muted small mb-3">
        <span>System Status:</span>
        <span class="meta-tag">{{ sysStore.status }}</span>
      </div>

      <GhostButton @click="handleLogout" class="w-100 f-s" theme="danger" >
        Logout
      </GhostButton>
      
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useSysStore } from '@/stores/system';
import { useUserStore } from '@/stores/user';

import router from '@/router';

import BaseHeader from '@/components/base/BaseHeader.vue';
import BaseIconText from '@/components/base/BaseIconText.vue';
import GhostButton from '@/components/base/GhostButton.vue';
import UnderlinedInput from '@/components/base/UnderlinedInput.vue';
import SidebarSettingItem from '@/components/sidebar/SidebarSetting.vue';

import InfoIcon from "@/assets/icons/info.svg"


const sysStore = useSysStore()
const uesrStore = useUserStore()


onMounted(async () => {
  await sysStore.refreshSysStatus()
  await sysStore.refreshSystemSettings()
})


const pwdForm = reactive({
  new: '',
  confirm: ''
});
const isSavingPwd = ref(false);
const isPwdLenValid = computed(() => pwdForm.new.length >= 6 )
const isPwdConfValid = computed(() => pwdForm.new === pwdForm.confirm )

const handleLogout = async () => {
  const isDone = await uesrStore.logout()
  if (isDone) {
    router.push("/login")
  }
}

const handleUpdatePassword = async () => {
  isSavingPwd.value = true;
  const isDone = await uesrStore.updatePassword(pwdForm.new);
  isSavingPwd.value = false;
  if (isDone) {
    await handleLogout();
  }
};

const handleUpdateSetting = async (id: string, newValue: string | boolean) => {
  await sysStore.updateSystemSetting(id, newValue);
};

</script>
