<template>
  <AuthLayout>
    <h1 class="auth-title">Login</h1>
    <form @submit.prevent="onLogin" class="auth-form">
      <FilledInput
        v-model="loginForm.username"
        label="Name"
        type="text"
        autocomplete="username"
        class="auth-field"
        :disabled="userStore.isLoginPending()"
        placeholder=""
      />

      <FilledInput
        v-model="loginForm.password"
        label="Password"
        type="password"
        autocomplete="current-password"
        class="auth-field"
        :disabled="userStore.isLoginPending()"
        placeholder=""
      />

      <div class="links-row">
        <div class="auth-register-slot f-s">
          <AsyncGate
            tag="span"
            :status="sysStore.registrationAllowedState"
            :is-empty="!sysStore.canUserRegister"
          >
            <template #loading>
              <BaseSkeleton
                width="var(--auth-register-placeholder-width)"
                height="var(--auth-register-placeholder-height)"
              />
            </template>

            <template #empty>
              <span class="register-link-placeholder"></span>
            </template>

            <button
              type="button"
              @click="showRegisterModal = true"
            >
              Create an account
            </button>
          </AsyncGate>
        </div>
        <label
          class="choice-control f-s fw-semibold"
          :class="{ 'is-disabled': userStore.isLoginPending() }"
        >
          <input
            class="choice-input"
            type="checkbox"
            v-model="loginForm.remember_me"
            :disabled="userStore.isLoginPending()"
          >
          <span class="choice-box"></span>
          <span>Remember me</span>
        </label>
      </div>

      <hr class="separator-line" />

      <div class="auth-submit-row">
        <GhostButton
          class="auth-submit-button f-l fw-bold"
          type="submit"
          :loading="userStore.isLoginPending()"
          :disabled="userStore.isLoginPending()"
        >
          Sign in
        </GhostButton>
      </div>
    </form>
  </AuthLayout>
  <RegisterModal v-model="showRegisterModal" />
</template>

<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSysStore } from '@/stores/system'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AsyncGate from '@/components/base/AsyncGate.vue'
import FilledInput from '@/components/base/FilledInput.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import RegisterModal from '@/components/overlay/modals/RegisterModal.vue'

import router from '@/router'
import { resolvePostAuthRedirect } from '@/router/auth'

const userStore = useUserStore()
const sysStore = useSysStore()
const route = useRoute()

const showRegisterModal = ref(false)
const loginForm = reactive({ username: '', password: '', remember_me: false })

const onLogin = async () => {
  const response = await userStore.login(loginForm)
  if (response !== null) {
    await router.replace(resolvePostAuthRedirect(route.query.redirect))
  }
}

onMounted(async () => {
  await sysStore.refreshUserRegistrationAllowed().catch(() => null)
})

</script>

<style scoped>
.auth-title {
  font-size: var(--auth-title-current-font-size);
  font-weight: 700;
  color: var(--color-text-pri);
  margin-bottom: var(--auth-title-current-margin-bottom);
  letter-spacing: var(--auth-title-letter-spacing);
}

.auth-form .links-row {
  display: flex;
  flex-direction: var(--auth-links-direction);
  align-items: var(--auth-links-align-items);
  gap: var(--auth-links-gap);
  justify-content: space-between;
  margin-bottom: var(--auth-links-margin-bottom);
}

.auth-field {
  margin-bottom: var(--auth-field-gap);
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

.auth-register-slot {
  padding: 0;
  margin: 0;
}

.auth-form .links-row button::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: var(--divider-line-width);
  background-color: var(--color-text-sec);

  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--motion-medium-duration) ease;
}

.register-link-placeholder {
  display: inline-block;
  width: var(--auth-register-placeholder-width);
  height: var(--auth-register-placeholder-height);
}

.auth-submit-row {
  display: flex;
  justify-content: center;
}

.auth-submit-button {
  width: var(--auth-submit-current-width);
  padding: var(--auth-submit-padding);
}

@media (hover: hover) {
  .auth-form .links-row button:hover::after {
    transform: scaleX(1);
  }
}

</style>
