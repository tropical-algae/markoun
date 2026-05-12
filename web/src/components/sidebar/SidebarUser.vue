<template>
  <div class="d-flex flex-column h-100">
    <BaseHeader>
      <div class="f-m fw-bold text-uppercase">Account</div>
    </BaseHeader>

    <div class="user-sidebar-body container-fluid flex-grow-1 overflow-y-scroll p-0 my-3">
      <section class="mb-4">
        <div class="text-uppercase fw-bold mb-2 f-m fc-pri">Profile</div>

        <div ref="profileMotionShellRef">
          <div ref="profileMotionContentRef" class="user-profile-motion-content">
            <AsyncGate
              :status="userStore.currentUserProfileState"
              :is-empty="!userStore.currentUserProfile"
            >
              <template #loading>
                <div class="user-profile-shell">
                  <BaseSkeleton width="52%" height="1.1rem" />

                  <div class="user-meta-shell user-meta-shell-loading mt-3">
                    <BaseSkeleton width="60px" height="0.7rem" />
                    <div class="user-tag-shell">
                      <BaseSkeleton width="56px" height="var(--meta-tag-height)" />
                      <BaseSkeleton width="44px" height="var(--meta-tag-height)" />
                    </div>

                    <BaseSkeleton width="46px" height="0.7rem" />
                    <BaseSkeleton width="72px" height="0.8rem" />

                    <BaseSkeleton width="50px" height="0.7rem" />
                    <BaseSkeleton width="110px" height="0.8rem" />
                  </div>
                </div>
              </template>

              <template #empty>
                <div class="user-profile-empty f-s fc-sec">
                  User information is temporarily unavailable.
                </div>
              </template>

              <div class="user-profile-card">
                <div class="user-name f-m fw-bold fc-pri">
                  {{ userStore.currentUserProfile?.full_name || 'Unnamed user' }}
                </div>
                <div class="user-email f-s">
                  {{ userStore.currentUserProfile?.email }}
                </div>

                <div class="user-meta-grid mt-3">
                  <span class="user-meta-label f-s">Scopes</span>
                  <div class="user-scopes">
                    <span
                      v-for="scope in userStore.currentUserProfile?.scopes || []"
                      :key="scope"
                      class="meta-tag"
                    >
                      {{ scope }}
                    </span>
                  </div>

                  <span class="user-meta-label f-s">Status</span>
                  <span class="user-meta-value f-s">
                    {{ userStore.currentUserProfile?.is_active ? 'Active' : 'Inactive' }}
                  </span>

                  <span class="user-meta-label f-s">Joined</span>
                  <span class="user-meta-value f-s">
                    {{ userStore.currentUserProfile?.joined_at || 'Unknown' }}
                  </span>
                </div>
              </div>
            </AsyncGate>
          </div>
        </div>
      </section>

      <section class="mb-4">
        <div class="text-uppercase fw-bold mb-2 f-m fc-pri">Security</div>

        <div class="mb-3">
          <UnderlinedInput
            v-model="pwdForm.new"
            label="New password"
            type="password"
            class="mb-3 f-s"
            placeholder="Enter new password"
          />
          <UnderlinedInput
            v-model="pwdForm.confirm"
            label="Confirm password"
            type="password"
            class="mb-1 f-s"
            placeholder="Confirm new password"
          />

          <BaseIconText
            :icon="InfoIcon"
            :text="pwdHint"
            color="var(--color-bg-error)"
            class="password-hint"
            :style="{ opacity: showPwdHint ? 1 : 0 }"
          />
        </div>

        <GhostButton
          class="w-100 f-s"
          :disabled="!isPwdLenValid || !isPwdConfValid || isPwdButtonPending"
          :loading="isPwdButtonPending"
          @click="handleUpdatePassword"
        >
          Update Password
        </GhostButton>
      </section>
    </div>

    <div class="user-sidebar-footer horizontal-line-top flex-shrink-0 fc-pri py-3">
      <GhostButton
        class="w-100 f-s"
        theme="danger"
        :disabled="isLogoutButtonPending"
        :loading="isLogoutButtonPending"
        @click="handleLogout"
      >
        Logout
      </GhostButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import router from '@/router';
import { useUserStore } from '@/stores/user';
import { useHeightMotion } from '@/composables/useHeightMotion';
import { USER_PROFILE_HEIGHT_MOTION_DURATION } from '@/constants/ui';

import AsyncGate from '@/components/base/AsyncGate.vue';
import BaseHeader from '@/components/base/BaseHeader.vue';
import BaseIconText from '@/components/base/BaseIconText.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import GhostButton from '@/components/base/GhostButton.vue';
import UnderlinedInput from '@/components/base/UnderlinedInput.vue';

import InfoIcon from '@/assets/icons/info.svg';

const userStore = useUserStore()
const profileMotionShellRef = ref<HTMLElement | null>(null)
const profileMotionContentRef = ref<HTMLElement | null>(null)
const profileMotion = useHeightMotion(profileMotionShellRef, profileMotionContentRef, {
  duration: USER_PROFILE_HEIGHT_MOTION_DURATION,
  enterEase: 'power2.out',
})

const pwdForm = reactive({
  new: '',
  confirm: '',
})
const isPwdFlowPending = ref(false)
const isPwdButtonPending = computed(() =>
  isPwdFlowPending.value || userStore.isUpdatePasswordPending()
)

const isLogoutFlowPending = ref(false)
const isLogoutButtonPending = computed(() =>
  isLogoutFlowPending.value || userStore.isLogoutPending()
)

const isPwdLenValid = computed(() => pwdForm.new.length >= 6)
const isPwdConfValid = computed(() => pwdForm.new === pwdForm.confirm)
const showPwdHint = computed(() => {
  return Boolean(pwdForm.new && pwdForm.confirm) && (!isPwdLenValid.value || !isPwdConfValid.value)
})
const pwdHint = computed(() => {
  return !isPwdLenValid.value ? 'Password must be longer than 6.' : 'Passwords do not match.'
})

onMounted(async () => {
  await nextTick()
  profileMotion.connectResizeObserver()
  void userStore.refreshCurrentUserProfile().catch(() => null)
})

watch(
  [
    () => userStore.currentUserProfileState,
    () => userStore.currentUserProfile,
  ],
  async () => {
    await nextTick()
    profileMotion.animateHeightToContent()
  },
  { flush: 'post' }
)

onBeforeUnmount(() => {
  profileMotion.disconnectResizeObserver()
})

const handleLogout = async () => {
  if (isLogoutFlowPending.value) {
    return
  }

  isLogoutFlowPending.value = true
  try {
    const isDone = await userStore.logout()
    if (isDone) {
      await router.replace({ name: 'Login' })
    }
  } finally {
    isLogoutFlowPending.value = false
  }
}

const handleUpdatePassword = async () => {
  if (isPwdFlowPending.value) {
    return
  }

  isPwdFlowPending.value = true
  try {
    const isDone = await userStore.updatePassword(pwdForm.new)
    if (isDone) {
      await handleLogout()
    }
  } finally {
    isPwdFlowPending.value = false
  }
}
</script>

<style scoped>
.user-sidebar-body {
  min-height: 0;
}

.user-profile-motion-content {
  width: 100%;
}

.user-profile-card,
.user-profile-shell,
.user-profile-empty {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  white-space: normal;
  background-color: var(--color-bg-sec);
  padding: var(--profile-card-padding);
  transition:
    background-color var(--motion-theme-duration) ease,
    border-color var(--motion-theme-duration) ease;
}

.user-profile-empty {
  color: var(--color-text-sec);
}

.user-name {
  line-height: var(--profile-name-line-height);
}

.user-email {
  color: var(--color-text-sec);
  line-height: var(--profile-email-line-height);
}

.user-scopes {
  display: flex;
  gap: var(--hint-gap);
}


.user-meta-grid,
.user-meta-shell {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--profile-meta-gap-y) var(--profile-meta-gap-x);
  align-items: center;
}

.user-meta-label {
  color: var(--color-text-sec);
  text-transform: uppercase;
  font-weight: 700;
}

.user-meta-value {
  min-width: 0;
  color: var(--color-text-pri);
  line-height: var(--profile-meta-value-line-height);
  word-break: break-word;
}

.user-tag-shell {
  display: flex;
  gap: var(--hint-gap);
}

.user-meta-shell-loading {
  margin-top: 1rem;
}

.password-hint {
  transition: opacity var(--password-hint-opacity-duration) ease;
}

.profile-swap-enter-active,
.profile-swap-leave-active {
  transition: opacity var(--motion-soft-duration) ease;
}

.profile-swap-enter-from,
.profile-swap-leave-to {
  opacity: 0;
}
</style>
