import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useActionLedger } from '@/composables/useActionLedger'
import {
  checkTokenApi,
  getCurrentUserProfileApi,
  loginApi,
  logoutApi,
  registerApi,
  updatePasswordApi,
} from '@/api/user'
import { useToastStore } from '@/stores/toast'
import type { AsyncStatus } from '@/types/async'
import type { CurrentUserProfile, LoginForm, RegisterForm } from '@/types/auth'

const PASSWD_MIN_LEN = 6
const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,31}$/
type AuthState = 'unknown' | 'authenticated' | 'anonymous'

export const useUserStore = defineStore('user', () => {
  const authState = ref<AuthState>('unknown')
  const authCheckStatus = ref<AsyncStatus>('idle')
  const currentUserProfile = ref<CurrentUserProfile | null>(null)
  const currentUserProfileState = ref<AsyncStatus>('idle')
  const toastStore = useToastStore()
  const actionLedger = useActionLedger()

  let authCheckPromise: Promise<AuthState> | null = null
  let currentUserProfilePromise: Promise<CurrentUserProfile | null> | null = null
  let profileGeneration = 0

  const isAuthenticated = computed(() => authState.value === 'authenticated')
  const isAnonymous = computed(() => authState.value === 'anonymous')
  const isAuthKnown = computed(() => authState.value !== 'unknown')

  const markAuthenticated = () => {
    authState.value = 'authenticated'
    authCheckStatus.value = 'ready'
  }

  const resetUserProfileState = () => {
    profileGeneration += 1
    currentUserProfilePromise = null
    currentUserProfile.value = null
    currentUserProfileState.value = 'idle'
  }

  const markAnonymous = () => {
    resetUserProfileState()
    authState.value = 'anonymous'
    authCheckStatus.value = 'ready'
  }

  const login = async (loginForm: LoginForm) => {
    try {
      if (loginForm.username === '' || loginForm.password === '') {
        toastStore.pushNotice('error', `Null value is not allowed.`)
        return null
      }

      return await actionLedger.runAction('login', async () => {
        const res = await loginApi(loginForm)
        resetUserProfileState()
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
      if (!USERNAME_PATTERN.test(registerForm.username)) {
        toastStore.pushNotice(
          'warning',
          'Username must start with a letter or number and use 3-32 letters, numbers, underscores, or hyphens.',
        )
        return false
      }
      await actionLedger.runAction('register', async () => {
        await registerApi(registerForm)
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

    if (authCheckPromise) {
      return authCheckPromise
    }

    authCheckPromise = (async () => {
      authCheckStatus.value = 'loading'
      try {
        await checkTokenApi()
        markAuthenticated()
      } catch (_) {
        markAnonymous()
      } finally {
        authCheckPromise = null
      }

      return authState.value
    })()

    return authCheckPromise
  }

  const logout = async (): Promise<boolean> => {
    try {
      await actionLedger.runAction('logout', async () => {
        await logoutApi()
      })
      markAnonymous()
      return true
    } catch (_) {
      return false
    }
  }

  const handleUnauthorized = () => {
    markAnonymous()
  }

  const refreshCurrentUserProfile = async (
    force = false
  ): Promise<CurrentUserProfile | null> => {
    if (!isAuthenticated.value) {
      currentUserProfile.value = null
      currentUserProfileState.value = 'idle'
      return null
    }

    if (!force && currentUserProfile.value && currentUserProfileState.value === 'ready') {
      return currentUserProfile.value
    }

    if (!force && currentUserProfilePromise) {
      return currentUserProfilePromise
    }

    currentUserProfileState.value = currentUserProfile.value ? 'refreshing' : 'loading'
    const requestGeneration = profileGeneration
    const operation = (async () => {
      try {
        const profile = await getCurrentUserProfileApi()
        if (requestGeneration !== profileGeneration) {
          return null
        }
        currentUserProfile.value = profile.data
        currentUserProfileState.value = 'ready'
        return profile.data
      } catch (error) {
        if (requestGeneration !== profileGeneration) {
          return null
        }
        currentUserProfileState.value = 'error'
        throw error
      } finally {
        if (requestGeneration === profileGeneration) {
          currentUserProfilePromise = null
        }
      }
    })()
    currentUserProfilePromise = operation
    return operation
  }

  const updatePassword = async (newPasswd: string): Promise<boolean> => {
    try {
      await actionLedger.runAction('update-password', async () => {
        await updatePasswordApi(newPasswd)
      })
      toastStore.pushNotice('info', `Password updated successfully.`)
      return true
    } catch (_) {
      return false
    }
  }

  return {
    authState,
    authCheckStatus,
    currentUserProfile,
    currentUserProfileState,
    isAuthenticated,
    isAnonymous,
    isAuthKnown,
    isCheckingAuth: () => authCheckStatus.value === 'loading',
    isLoginPending: () => actionLedger.isActionPending('login'),
    isRegisterPending: () => actionLedger.isActionPending('register'),
    isLogoutPending: () => actionLedger.isActionPending('logout'),
    isUpdatePasswordPending: () => actionLedger.isActionPending('update-password'),
    login,
    register,
    ensureAuthKnown,
    logout,
    handleUnauthorized,
    refreshCurrentUserProfile,
    updatePassword,
  }
})
