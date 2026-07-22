<template>
  <AuthLayout>
    <h1 class="auth-title">Login</h1>
    <form @submit.prevent="onLogin" class="auth-form">
      <FilledInput
        v-model="loginForm.username"
        label="Name"
        type="text"
        name="username"
        autocomplete="username"
        class="auth-field"
        :disabled="userStore.isLoginPending()"
        placeholder=""
      />

      <FilledInput
        v-model="loginForm.password"
        label="Password"
        type="password"
        name="password"
        autocomplete="current-password"
        class="auth-field"
        :disabled="userStore.isLoginPending()"
        placeholder=""
      />

      <div class="links-row">
        <div class="auth-register-slot f-s">
          <AsyncGate
            tag="div"
            class="auth-register-gate"
            :status="sysStore.registrationAllowedState"
            :is-empty="!sysStore.canUserRegister"
          >
            <template #loading>
              <BaseSkeleton
                width="var(--skeleton-width-md)"
                height="var(--skeleton-text-height-sm)"
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
            name="remember_me"
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

.auth-field {
  margin-bottom: var(--space-lg);
}

.auth-form .links-row {
  display: flex;
  flex-direction: var(--auth-links-direction);
  align-items: var(--auth-links-align-items);
  gap: var(--auth-links-gap);
  justify-content: space-between;
  margin-bottom: var(--auth-links-margin-bottom);
}

.auth-form .separator-line {
  margin-block: var(--auth-hr-margin-block);
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
  order: var(--auth-register-order);
  align-self: stretch;
  flex: 1 1 0;
  min-width: 0;
  min-height: var(--skeleton-height-default);
  padding: 0;
  margin: 0;
}

.auth-register-gate {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  min-height: inherit;
}

.auth-form .links-row button::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: var(--line-width);
  background-color: var(--color-text-sec);

  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--motion-medium-duration) ease;
}

.register-link-placeholder {
  display: block;
  width: var(--skeleton-width-md);
  height: var(--skeleton-text-height-sm);
}

.auth-submit-row {
  display: flex;
  justify-content: center;
}

.auth-submit-button {
  width: var(--auth-submit-current-width);
  padding: var(--space-sm);
}

@media (hover: hover) {
  .auth-form .links-row button:hover::after {
    transform: scaleX(1);
  }
}

</style>
