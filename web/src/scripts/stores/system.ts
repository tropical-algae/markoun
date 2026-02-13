import { defineStore } from 'pinia'
import { ref } from 'vue'
import { checkSystemStatusApi, getAvailableSettingApi, updateSettingApi } from '@/api/system'
import type { SysSettingResponse } from '@/scripts/types'


export const useSysStore = defineStore('sys', () => {
  const version = ref('')
  const status = ref('')
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

  const updateSystemSetting = async (id: string, newValue: string | boolean) => {
    const item = currentSettings.value.find(s => s.id === id);
    if (item) {
      await updateSettingApi(id, newValue);
      (item as any).value = newValue;
    }

  }

  return { 
    version, status, currentSettings, 
    refreshSysStatus, refreshSystemSettings, updateSystemSetting 
  }
});