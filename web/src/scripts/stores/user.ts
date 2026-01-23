import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginReq, testTokenReq, logoutReq, type LoginForm } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const isAuthed = ref(false)
  const isChecked = ref(false)
  let checkPromise: Promise<boolean> | null = null 

  const handleLogin = async (loginForm: LoginForm) => {
    try {
      const res = await loginReq(loginForm)
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
        const res = await testTokenReq()
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

  const logout = async () => {
    await logoutReq()
    isAuthed.value = false
    isChecked.value = false
  }

  return { handleLogin, checkAuth, logout }
})