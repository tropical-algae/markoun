import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi, checkTokenApi, logoutApi, type LoginForm } from '@/api/user'
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
      console.log("验证过")
      return isAuthed.value
    }

    if (checkPromise) {
      return checkPromise
    }

    checkPromise = (async () => {
      try {
        console.log("执行后端验证...")
        const res = await checkTokenApi()
        console.log(res)
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
    const response = await logoutApi()
    if (response.status === 200) {
      isAuthed.value = false
      isChecked.value = false
      return true
    }
    return false
  }

  return { login, checkAuth, logout }
})