<template>
  <div class="settings-container d-flex flex-column h-100">

    <BaseHeader>
      <div class="f-l fw-bold">Settings</div>
    </BaseHeader>

    <div class="settings-content flex-grow-1 overflow-y-scroll p-3">
      
      <section class="mb-4">
        <div class="text-uppercase fw-bold mb-3 f-m">Account</div>

        <div class="mb-3">
          <InputField
            v-model="pwdForm.new"
            ref="inputRef"
            label="New password"
            type="password"
            class="mb-3"
            placeholder="Enter new password"
          />

          <InputField
            v-model="pwdForm.confirm"
            ref="inputRef"
            label="Confirm password"
            type="password"
            class="mb-1"
            placeholder="Confirm new password"
          />

          <TextHint 
            :icon="InfoIcon" 
            :text="isPwdLenValid ? 'Passwords do not match.' : 'Password must be longer than 6.'" 
            color="var(--color-bg-error)"
            v-if="(pwdForm.new && pwdForm.confirm) && (!isPwdLenValid || !isPwdConfValid)"
          />
        </div>

        <button 
          class="btn btn-primary btn-sm w-100" 
          :disabled="!isPwdLenValid || !isPwdConfValid || isSavingPwd"
          @click="handleUpdatePassword"
        >
          Update Password
        </button>

      </section>

      <section class="mb-4" v-if="sysStore.currentSettings.length > 0">
        <div class="text-uppercase fw-bold mb-3 f-m">Preferences</div>
        <SettingItem
          v-for="item in sysStore.currentSettings"
          :key="item.id"
          :setting="item"
          @update="handleUpdateSetting"
        />
      </section>

      <section class="mb-4">
        <button 
          class="btn btn-primary btn-sm w-100"
          @click="handleLogout"
        >
          Logout
        </button>

      </section>

    </div>

    <div class="p-3 border-top bg-white flex-shrink-0">
      
      <div class="d-flex justify-content-between align-items-center text-muted small">
        <span>App Version:</span>
        <span class="node-tag">v{{ sysStore.version }}</span>
      </div>
      
      <div class="d-flex justify-content-between align-items-center text-muted small mt-1">
        <span>System Status:</span>
        <span class="node-tag">{{ sysStore.status }}</span>
      </div>
      
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import BaseHeader from '@/components/common/BaseHeader.vue';
import { useSysStore } from '@/scripts/stores/system';
import { useUserStore } from '@/scripts/stores/user';
import InputField from '@/components/common/InputField.vue';
import TextHint from '@/components/common/TextHint.vue';
import SettingItem from '@/components/common/SettingItem.vue';

import InfoIcon from "@/assets/icons/info.svg"
import router from '@/router';


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


const handleUpdatePassword = async () => {
  isSavingPwd.value = true;
  isSavingPwd.value = false;
};

const handleUpdateSetting = async (id: string, newValue: string | boolean) => {
  await sysStore.updateSystemSetting(id, newValue);
};

const handleLogout = async () => {
  const isDone = await uesrStore.logout()
  if (isDone) {
    router.push("/login")
  }
}

</script>
