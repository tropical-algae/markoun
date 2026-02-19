import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi, checkTokenApi, logoutApi, type LoginForm, updatePasswordApi } from '@/api/user'
import { useNoticeStore } from "@/scripts/stores/notice";

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

  return { login, checkAuth, logout, updatePassword }
})