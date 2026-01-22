import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, type LoginForm } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('access_token') || '')
  const userInfo = ref<any>({})

  const handleLogin = async (loginForm: LoginForm) => {
    try {
      const res = await login(loginForm)
      const accessToken = res.access_token
      
      token.value = accessToken
      localStorage.setItem('access_token', accessToken)
      return res
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = {}
    localStorage.removeItem('access_token')
  }

  return { token, userInfo, handleLogin, logout }
})