import { defineStore } from 'pinia'
import { ref } from 'vue'
import { checkSystemStatusApi, getAvailableSettingApi, isAllowRegisterApi, updateSettingApi } from '@/api/system'
import type { SysSettingResponse } from '@/types/types'


export const useSysStore = defineStore('sys', () => {
  const version = ref('')
  const status = ref('')
  const canUserRegister = ref(false)
  const currentSettings = ref<SysSettingResponse[]>([])

  const refreshSysStatus = async () => {
    const response = await checkSystemStatusApi();
    version.value = response.data.version
    status.value = response.data.status
  }

  const refreshSystemSettings = async () => {
    const response = await getAvailableSettingApi();
    currentSettings.value = response.data
  }

  const refreshUserRegistrationAllowed = async () => {
    const response = await isAllowRegisterApi()
    if (response.status === 200) {
      canUserRegister.value = response.data
    }
  }

  const updateSystemSetting = async (id: string, newValue: string | boolean) => {
    const item = currentSettings.value.find(s => s.id === id);
    if (item) {
      await updateSettingApi(id, newValue);
      (item as any).value = newValue;
    }

  }

  return { 
    version, status, canUserRegister, currentSettings, 
    refreshSysStatus, refreshSystemSettings, refreshUserRegistrationAllowed, updateSystemSetting 
  }
});