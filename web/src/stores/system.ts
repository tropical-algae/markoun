import { defineStore } from 'pinia'
import { ref } from 'vue'
import { checkSystemStatusApi, getAvailableSettingApi, isAllowRegisterApi, updateSettingApi } from '@/api/system'
import { useActionLedger } from '@/composables/useActionLedger'
import type { AsyncStatus } from '@/types/async'
import { SysSettingType, type SysSettingResponse } from '@/types/system'


export const useSysStore = defineStore('sys', () => {
  const version = ref('')
  const status = ref('')
  const canUserRegister = ref(false)
  const currentSettings = ref<SysSettingResponse[]>([])
  const sysStatusState = ref<AsyncStatus>('idle')
  const settingsState = ref<AsyncStatus>('idle')
  const registrationAllowedState = ref<AsyncStatus>('idle')
  const actionLedger = useActionLedger()

  const withUpdatedSettingValue = (
    setting: SysSettingResponse,
    value: string | boolean,
  ): SysSettingResponse | null => {
    if (setting.type === SysSettingType.BOOL && typeof value === 'boolean') {
      return { ...setting, value }
    }

    if (setting.type === SysSettingType.STR && typeof value === 'string') {
      return { ...setting, value }
    }

    return null
  }

  const refreshSysStatus = async () => {
    sysStatusState.value = version.value === '' ? 'loading' : 'refreshing'
    try {
      const response = await checkSystemStatusApi();
      version.value = response.data.version
      status.value = response.data.status
      sysStatusState.value = 'ready'
    } catch (error) {
      sysStatusState.value = 'error'
      throw error
    }
  }

  const refreshSystemSettings = async () => {
    settingsState.value = currentSettings.value.length === 0 ? 'loading' : 'refreshing'
    try {
      const response = await getAvailableSettingApi();
      currentSettings.value = response.data
      settingsState.value = 'ready'
    } catch (error) {
      settingsState.value = 'error'
      throw error
    }
  }

  const refreshUserRegistrationAllowed = async () => {
    registrationAllowedState.value = registrationAllowedState.value === 'idle' ? 'loading' : 'refreshing'
    try {
      const response = await isAllowRegisterApi()
      if (response.status === 200) {
        canUserRegister.value = response.data
      }
      registrationAllowedState.value = 'ready'
    } catch (error) {
      registrationAllowedState.value = 'error'
      throw error
    }
  }

  const updateSystemSetting = async (id: string, newValue: string | boolean): Promise<boolean> => {
    const setting = currentSettings.value.find((item) => item.id === id);
    if (!setting) {
      return false
    }

    const nextSetting = withUpdatedSettingValue(setting, newValue)
    if (!nextSetting) {
      return false
    }

    const previousSettings = currentSettings.value
    currentSettings.value = currentSettings.value.map((item) => {
      return item.id === id ? nextSetting : item
    })

    try {
      await actionLedger.runAction(`setting:${id}`, async () => {
        await updateSettingApi(id, newValue);
      })
      return true
    } catch (_) {
      currentSettings.value = previousSettings
      return false
    }
  }

  const isSettingUpdating = (id: string): boolean => actionLedger.isActionPending(`setting:${id}`)

  return { 
    version,
    status,
    canUserRegister,
    currentSettings,
    sysStatusState,
    settingsState,
    registrationAllowedState,
    refreshSysStatus,
    refreshSystemSettings,
    refreshUserRegistrationAllowed,
    updateSystemSetting,
    isSettingUpdating,
  }
});
