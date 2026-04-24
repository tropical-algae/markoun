import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useActionLedger } from '@/composables/useActionLedger'
import { loginApi, checkTokenApi, logoutApi, updatePasswordApi, registerApi } from '@/api/user'
import { useToastStore } from "@/stores/toast";
import type { AsyncStatus } from '@/types/async';
import type { LoginForm, RegisterForm } from '@/types/auth';

const NAME_MIN_LEN = 3
const PASSWD_MIN_LEN = 6

export const useUserStore = defineStore('user', () => {
  const isAuthed = ref(false)
  const isChecked = ref(false)
  const authCheckStatus = ref<AsyncStatus>('idle')
  const toastStore = useToastStore()
  const actionLedger = useActionLedger()

  let checkPromise: Promise<boolean> | null = null 

  const login = async (loginForm: LoginForm) => {
    try {
      if (loginForm.username === '' || loginForm.password === '') {
        toastStore.pushNotice('error', `Null value is not allowed.`)
        return null
      }

      return await actionLedger.runAction('login', async () => {
        const res = await loginApi(loginForm)
        isAuthed.value = true
        isChecked.value = true
        authCheckStatus.value = 'ready'
        return res
      })
    } catch (error) {
      isAuthed.value = false
      isChecked.value = false 
      throw error
    }
  }

  const register = async (registerForm: RegisterForm): Promise<boolean> => {
    try {
      if (registerForm.password.length < PASSWD_MIN_LEN) {
        toastStore.pushNotice('warning', `Password must be longer than ${PASSWD_MIN_LEN}.`)
        return false
      }
      if (registerForm.username.length < NAME_MIN_LEN) {
        toastStore.pushNotice('warning', `Username must be longer than ${NAME_MIN_LEN}.`)
        return false
      }
      await actionLedger.runAction('register', async () => {
        await registerApi(registerForm);
      })
      toastStore.pushNotice('info', `Account for “${registerForm.username}” has been created.`)
      return true
    } catch (error) {
      throw error
    }
  }

  const checkAuth = async () => {
    if (isChecked.value) {
      return isAuthed.value
    }

    if (checkPromise) {
      return checkPromise
    }

    checkPromise = (async () => {
      authCheckStatus.value = 'loading'
      try {
        const res = await checkTokenApi()
        isAuthed.value = res.data
        authCheckStatus.value = 'ready'
        return isAuthed.value
      } catch (error) {
        isAuthed.value = false
        authCheckStatus.value = 'error'
        return false
      } finally {
        isChecked.value = true
        checkPromise = null
      }
    })()

    return checkPromise
  }

  const logout = async (): Promise<boolean> => {
    try {
      await actionLedger.runAction('logout', async () => {
        await logoutApi();
      })
      isAuthed.value = false
      isChecked.value = false
      authCheckStatus.value = 'idle'
      return true
    } catch (_) {
      return false
    }
  }

  const updatePassword = async (newPasswd: string): Promise<boolean> => {
    try {
      await actionLedger.runAction('update-password', async () => {
        await updatePasswordApi(newPasswd);
      })
      toastStore.pushNotice('info', `Password updated successfully.`)
      return true
    } catch (_) {
      return false
    }
  }

  return {
    isAuthed,
    isChecked,
    authCheckStatus,
    isCheckingAuth: () => authCheckStatus.value === 'loading',
    isLoginPending: () => actionLedger.isActionPending('login'),
    isRegisterPending: () => actionLedger.isActionPending('register'),
    isLogoutPending: () => actionLedger.isActionPending('logout'),
    isUpdatePasswordPending: () => actionLedger.isActionPending('update-password'),
    login,
    register,
    checkAuth,
    logout,
    updatePassword,
  }
})
