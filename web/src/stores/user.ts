import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi, checkTokenApi, logoutApi, updatePasswordApi, registerApi } from '@/api/user'
import { useNoticeStore } from "@/stores/notice";
import type { LoginForm, RegisterForm } from '@/types/types';

const NAME_MIN_LEN = 3
const PASSWD_MIN_LEN = 6

export const useUserStore = defineStore('user', () => {
  const isAuthed = ref(false)
  const isChecked = ref(false)
  const noticeStore = useNoticeStore()

  let checkPromise: Promise<boolean> | null = null 

  const login = async (loginForm: LoginForm) => {
    try {
      if (loginForm.username === '' || loginForm.password === '') {
        noticeStore.pushNotice('error', `Null value is not allowed.`)
        return null
      }

      const res = await loginApi(loginForm)
      isAuthed.value = true
      isChecked.value = true
      return res
    } catch (error) {
      isAuthed.value = false
      isChecked.value = false 
      throw error
    }
  }

  const register = async (registerForm: RegisterForm): Promise<boolean> => {
    try {
      if (registerForm.password.length < PASSWD_MIN_LEN) {
        noticeStore.pushNotice('warning', `Password must be longer than ${PASSWD_MIN_LEN}.`)
        return false
      }
      if (registerForm.username.length < NAME_MIN_LEN) {
        noticeStore.pushNotice('warning', `Username must be longer than ${NAME_MIN_LEN}.`)
        return false
      }
      await registerApi(registerForm);
      noticeStore.pushNotice('info', `Account for “${registerForm.username}” has been created.`)
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
      try {
        const res = await checkTokenApi()
        isAuthed.value = res.data
        return isAuthed.value
      } catch (error) {
        isAuthed.value = false
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
      await logoutApi();
      isAuthed.value = false
      isChecked.value = false
      return true
    } catch (_) {
      return false
    }
  }

  const updatePassword = async (newPasswd: string): Promise<boolean> => {
    try {
      await updatePasswordApi(newPasswd);
      noticeStore.pushNotice('info', `Password updated successfully.`)
      return true
    } catch (_) {
      return false
    }
  }

  return { login, register, checkAuth, logout, updatePassword }
})