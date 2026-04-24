import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useActionLedger } from '@/composables/useActionLedger'
import { loginApi, checkTokenApi, logoutApi, updatePasswordApi, registerApi } from '@/api/user'
import { useToastStore } from "@/stores/toast";
import type { AsyncStatus } from '@/types/async';
import type { LoginForm, RegisterForm } from '@/types/auth';

const NAME_MIN_LEN = 3
const PASSWD_MIN_LEN = 6
type AuthState = 'unknown' | 'authenticated' | 'anonymous'

export const useUserStore = defineStore('user', () => {
  const authState = ref<AuthState>('unknown')
  const authBootstrapStatus = ref<AsyncStatus>('idle')
  const toastStore = useToastStore()
  const actionLedger = useActionLedger()

  let bootstrapPromise: Promise<AuthState> | null = null

  const isAuthenticated = computed(() => authState.value === 'authenticated')
  const isAnonymous = computed(() => authState.value === 'anonymous')
  const isAuthKnown = computed(() => authState.value !== 'unknown')

  const markAuthenticated = () => {
    authState.value = 'authenticated'
    authBootstrapStatus.value = 'ready'
  }

  const markAnonymous = () => {
    authState.value = 'anonymous'
    authBootstrapStatus.value = 'ready'
  }

  const login = async (loginForm: LoginForm) => {
    try {
      if (loginForm.username === '' || loginForm.password === '') {
        toastStore.pushNotice('error', `Null value is not allowed.`)
        return null
      }

      return await actionLedger.runAction('login', async () => {
        const res = await loginApi(loginForm)
        markAuthenticated()
        return res
      })
    } catch (error) {
      markAnonymous()
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

  const ensureAuthKnown = async (): Promise<AuthState> => {
    if (isAuthKnown.value) {
      return authState.value
    }

    if (bootstrapPromise) {
      return bootstrapPromise
    }

    bootstrapPromise = (async () => {
      authBootstrapStatus.value = 'loading'
      try {
        await checkTokenApi()
        markAuthenticated()
      } catch (_) {
        markAnonymous()
      } finally {
        bootstrapPromise = null
      }

      return authState.value
    })()

    return bootstrapPromise
  }

  const logout = async (): Promise<boolean> => {
    try {
      await actionLedger.runAction('logout', async () => {
        await logoutApi();
      })
      markAnonymous()
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
    authState,
    authBootstrapStatus,
    isAuthenticated,
    isAnonymous,
    isAuthKnown,
    isBootstrappingAuth: () => authBootstrapStatus.value === 'loading',
    isLoginPending: () => actionLedger.isActionPending('login'),
    isRegisterPending: () => actionLedger.isActionPending('register'),
    isLogoutPending: () => actionLedger.isActionPending('logout'),
    isUpdatePasswordPending: () => actionLedger.isActionPending('update-password'),
    login,
    register,
    ensureAuthKnown,
    logout,
    updatePassword,
  }
})
