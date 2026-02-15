<template>
  <div class="auth-wrapper d-flex flex-column justify-content-center align-items-center">
		<div class="site-brand d-flex align-items-center">
			MARKOUN.
		</div>

    <div class="auth-container d-flex flex-grow-1 justify-content-center align-items-center">
      <div style="width: 100%; max-width: 480px; min-width: 300px;">

				<h1 class="auth-title">Login</h1>
				<form @submit.prevent="onLogin" class="auth-form">

          <InputField
            v-model="loginForm.username"
            label="Name"
            type="text"
            class="mb-3"
            placeholder=""
          />

          <InputField
            v-model="loginForm.password"
            ref="inputRef"
            label="Password"
            type="password"
            class="mb-3"
            placeholder=""
          />

					<div class="links-row mb-5">
            <div>
              <button v-if="sysStore.canUserRegister">Create an account</button>
            </div>
            <label class="d-flex gap-2">
              <input type="checkbox" v-model="loginForm.remember_me">
              <span>Remember me</span>
            </label>
					</div>

					<hr class="separator-line"/>

					<div class="d-flex justify-content-center">
						<!-- <button type="submit" class="confirm auth-submit">
							Sign in
						</button> -->
            <GhostButton class="f-l fw-bold" style="width: 220px;" type="submit">Sign in</GhostButton>
					</div>

				</form>

			</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useUserStore } from '@/scripts/stores/user'
import { useSysStore } from '@/scripts/stores/system'
import InputField from '@/components/common/InputField.vue'
import GhostButton from '@/components/common/GhostButton.vue';

import router from '@/router'

const userStore = useUserStore()
const sysStore = useSysStore()

const loginForm = reactive({ username: "", password: "", remember_me: false })
// const registerForm = reactive({ 
//   email: "", 
//   username: "", 
//   password: "", 
//   confirmPassword: "" 
// })

const onLogin = async () => {
	const response = await userStore.login(loginForm)
  if (response !== null) {
    router.push("/")
  }
}

onMounted(async () => {
  await sysStore.refreshUserRegistrationAllowed()
})

// const onRegister = async () => {
  
// }
</script>