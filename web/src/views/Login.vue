<template>
  <div class="auth-wrapper d-flex flex-column justify-content-center align-items-center">
		<div class="site-brand d-flex align-items-center">
			MARKOUN.
		</div>

    <div class="auth-container d-flex flex-grow-1 justify-content-center align-items-center">
      <div style="width: 100%; max-width: 480px; min-width: 300px;">

				<h1 class="auth-title">Login</h1>
				<form @submit.prevent="onLogin" class="auth-form">

          <FilledInput
            v-model="loginForm.username"
            label="Name"
            type="text"
            class="mb-3"
            placeholder=""
          />

          <FilledInput
            v-model="loginForm.password"
            ref="inputRef"
            label="Password"
            type="password"
            class="mb-3"
            placeholder=""
          />

					<div class="links-row mb-5">
            <div class="p-0 m-0 f-s">
              <button v-if="sysStore.canUserRegister" type="button" @click="showRegisterModal = true">
                Create an account
              </button>
            </div>
            <label class="d-flex gap-2 f-s">
              <input type="checkbox" v-model="loginForm.remember_me">
              <span>Remember me</span>
            </label>
					</div>

					<hr class="separator-line"/>

					<div class="d-flex justify-content-center">
            <GhostButton class="f-l fw-bold" style="width: 220px;" type="submit">Sign in</GhostButton>
					</div>

				</form>

			</div>
    </div>
  </div>
  <RegisterModal v-model="showRegisterModal"/>
</template>

<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useSysStore } from '@/stores/system'
import FilledInput from '@/components/base/FilledInput.vue'
import GhostButton from '@/components/base/GhostButton.vue';
import RegisterModal from '@/components/overlay/modals/RegisterModal.vue';

import router from '@/router'

const userStore = useUserStore()
const sysStore = useSysStore()

const showRegisterModal = ref(false);
const loginForm = reactive({ username: "", password: "", remember_me: false })

const onLogin = async () => {
	const response = await userStore.login(loginForm)
  if (response !== null) {
    router.push("/")
  }
}

onMounted(async () => {
  await sysStore.refreshUserRegistrationAllowed()
})

</script>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  width: 100%;
  padding: 0 80px 80px 80px;

  display: flex;
	
  justify-content: center;
}

.site-brand {
	height: 80px;
	width: 100%;
	color: var(--color-text-pri);
	font-weight: bold;
	font-size: 2rem;
}

.auth-container {
	width: 100%;
  background-color: var(--color-bg-sec);
  border: 1px solid var(--color-line);
  box-sizing: border-box;

  padding: 20px;
  border-top-right-radius: 120px;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 120px;
  border-bottom-right-radius: 5px;
  
  /* box-shadow: 0 -10px 20px rgba(123, 123, 123, 0.5);  */
}

.auth-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-pri);
  margin-bottom: 50px;
  letter-spacing: -1px;
}

.auth-form .links-row {
  display: flex;

  justify-content: space-between;
}

.auth-form .links-row button,
.auth-form .links-row span {
  color: var(--color-text-sec);
  text-decoration: none;
  font-weight: 600;
}

.auth-form .links-row button {
  position: relative;
}

.auth-form .links-row button::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 1px;
  background-color: var(--color-text-sec);

  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.auth-form .links-row button:hover::after {
  transform: scaleX(1);
}

.btn-container {
  display: flex;
  justify-content: center;
}

.auth-submit {
  font-size: 1.1rem;
  font-weight: bold;
  padding: 8px 80px;
  border-radius: 10px !important;
  background-color: var(--color-text-pri) !important;
}

</style>
