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