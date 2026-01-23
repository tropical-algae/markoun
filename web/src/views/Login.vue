<script setup lang="ts">
import { reactive } from 'vue'
import { useUserStore } from '@/scripts/stores/user'
import router from '@/router'

const userStore = useUserStore()

const loginForm = reactive({ username: "", password: "", remember_me: false })
// const registerForm = reactive({ 
//   email: "", 
//   username: "", 
//   password: "", 
//   confirmPassword: "" 
// })

const onLogin = async () => {
	await userStore.handleLogin(loginForm)
  router.push("/")
	// const tl = gsap.timeline()
	// tl.to(".auth-panel", { y: -50, opacity: 0, duration: 0.5 })
	// 	.add(() => {
	// 		router.push("/edit")
	// 	})
}

// const onRegister = async () => {
  
// }
</script>

<template>
  <div class="auth-wrapper d-flex flex-column justify-content-center align-items-center px-4 pb-4">
		<div class="site-brand d-flex align-items-center">
			MARKOUN.
		</div>

    <div class="auth-container d-flex flex-grow-1 justify-content-center align-items-center">
      <div style="width: 100%; max-width: 480px; min-width: 320px;">

				<h1 class="auth-title">Login</h1>
				<form @submit.prevent="onLogin" class="auth-form">
					
					<div class="auth-input-wrapper">
						<label class="input-label">Name</label>
						<input 
							v-model="loginForm.username" 
							type="text" 
							class="input-field"
						/>
					</div>

					<div class="auth-input-wrapper mb-3">
						<label class="input-label">Password</label>
						<input 
							v-model="loginForm.password" 
							type="password" 
							class="input-field"
							placeholder=""
						/>
					</div>

					<div class="links-row">
            <button >Create an account</button>
            <label class="d-flex gap-2">
              <input type="checkbox" v-model="loginForm.remember_me">
              <span>Remember me</span>
            </label>
					</div>

					<div class="d-flex justify-content-center">
						<button type="submit" class="auth-submit-btn">
							Sign in
						</button>
					</div>

				</form>

			</div>
    </div>
  </div>
</template>
