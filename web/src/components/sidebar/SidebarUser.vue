<template>
  <div class="d-flex flex-column h-100">
    <BaseHeader>
      <div class="f-m fw-bold text-uppercase">Account</div>
    </BaseHeader>

    <div class="container-fluid flex-grow-1 overflow-y-scroll py-2 user-sidebar-body">
      <section class="mb-5">
        <div class="text-uppercase fw-bold mb-3 f-m">Profile</div>

        <div ref="profileMotionShellRef" class="user-profile-motion-shell">
          <div ref="profileMotionContentRef" class="user-profile-motion-content">
            <AsyncGate
              :status="userStore.currentUserProfileState"
              :is-empty="!userStore.currentUserProfile"
            >
              <template #loading>
                <div class="user-profile-shell">
                  <BaseSkeleton width="52%" height="1.1rem" />
                  <BaseSkeleton width="68%" height="0.85rem" />

                  <div class="user-meta-shell user-meta-shell-loading mt-3">
                    <BaseSkeleton width="60px" height="0.7rem" />
                    <div class="user-tag-shell">
                      <BaseSkeleton width="56px" height="var(--meta-tag-height)" radius="4px" />
                      <BaseSkeleton width="44px" height="var(--meta-tag-height)" radius="4px" />
                    </div>

                    <BaseSkeleton width="46px" height="0.7rem" />
                    <BaseSkeleton width="72px" height="0.8rem" />

                    <BaseSkeleton width="50px" height="0.7rem" />
                    <BaseSkeleton width="110px" height="0.8rem" />
                  </div>
                </div>
              </template>

              <template #empty>
                <div class="user-profile-empty f-s">
                  User information is temporarily unavailable.
                </div>
              </template>

              <div class="user-profile-card">
                <div class="user-name f-m fw-bold">
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

      <section class="mb-5">
        <div class="text-uppercase fw-bold mb-3 f-m">Security</div>

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
            :text="passwordHint"
            color="var(--color-bg-error)"
            style="transition: opacity 0.2s;"
            :style="{ opacity: showPasswordHint ? 1 : 0 }"
          />
        </div>

        <GhostButton
          class="w-100 f-s"
          :disabled="!isPwdLenValid || !isPwdConfValid || userStore.isUpdatePasswordPending()"
          :loading="userStore.isUpdatePasswordPending()"
          @click="handleUpdatePassword"
        >
          Update Password
        </GhostButton>
      </section>
    </div>

    <div class="p-3 border-top bg-white flex-shrink-0 user-sidebar-footer">
      <GhostButton
        class="w-100 f-s"
        theme="danger"
        :disabled="userStore.isLogoutPending()"
        :loading="userStore.isLogoutPending()"
        @click="handleLogout"
      >
        Logout
      </GhostButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import router from '@/router';
import { useUserStore } from '@/stores/user';

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
let profileResizeObserver: ResizeObserver | null = null

const pwdForm = reactive({
  new: '',
  confirm: '',
})

const isPwdLenValid = computed(() => pwdForm.new.length >= 6)
const isPwdConfValid = computed(() => pwdForm.new === pwdForm.confirm)
const showPasswordHint = computed(() => {
  return Boolean(pwdForm.new && pwdForm.confirm) && (!isPwdLenValid.value || !isPwdConfValid.value)
})
const passwordHint = computed(() => {
  return !isPwdLenValid.value ? 'Password must be longer than 6.' : 'Passwords do not match.'
})

const disconnectProfileResizeObserver = () => {
  profileResizeObserver?.disconnect()
  profileResizeObserver = null
}

const animateProfileShellHeightToContent = () => {
  const shell = profileMotionShellRef.value
  const content = profileMotionContentRef.value
  if (!shell || !content) {
    return
  }

  const nextHeight = content.scrollHeight
  const currentHeight = shell.offsetHeight || nextHeight
  if (Math.abs(currentHeight - nextHeight) < 1) {
    shell.style.height = `${nextHeight}px`
    return
  }

  gsap.killTweensOf(shell)
  gsap.set(shell, { height: currentHeight })
  gsap.to(shell, {
    height: nextHeight,
    duration: 0.35,
    ease: 'power2.out',
    overwrite: 'auto',
  })
}

const connectProfileResizeObserver = () => {
  disconnectProfileResizeObserver()

  if (!profileMotionContentRef.value || !profileMotionShellRef.value) {
    return
  }

  profileMotionShellRef.value.style.height = `${profileMotionContentRef.value.scrollHeight}px`
  profileResizeObserver = new ResizeObserver(() => {
    animateProfileShellHeightToContent()
  })
  profileResizeObserver.observe(profileMotionContentRef.value)
}

onMounted(async () => {
  await nextTick()
  connectProfileResizeObserver()
  void userStore.refreshCurrentUserProfile().catch(() => null)
})

watch(
  [
    () => userStore.currentUserProfileState,
    () => userStore.currentUserProfile,
  ],
  async () => {
    await nextTick()
    animateProfileShellHeightToContent()
  },
  { flush: 'post' }
)

onBeforeUnmount(() => {
  disconnectProfileResizeObserver()
  if (profileMotionShellRef.value) {
    gsap.killTweensOf(profileMotionShellRef.value)
  }
})

const handleLogout = async () => {
  const isDone = await userStore.logout()
  if (isDone) {
    await router.replace({ name: 'Login' })
  }
}

const handleUpdatePassword = async () => {
  const isDone = await userStore.updatePassword(pwdForm.new)
  if (isDone) {
    await handleLogout()
  }
}
</script>

<style scoped>
.user-sidebar-body {
  min-height: 0;
}

.user-profile-motion-shell {
  overflow: hidden;
}

.user-profile-motion-content {
  width: 100%;
}

.user-profile-card,
.user-profile-shell,
.user-profile-empty {
  border: 1px solid var(--color-line);
  border-radius: 10px;
  white-space: normal;
  background-color: var(--color-bg-sec);
  padding: 14px;
}

.user-profile-shell {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-profile-empty {
  color: var(--color-text-sec);
}

.user-name {
  line-height: 1.3;
}

.user-email {
  color: var(--color-text-sec);
  line-height: 1.5;
}

.user-scopes {
  display: flex;
  gap: 6px;
}


.user-meta-grid,
.user-meta-shell {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 12px;
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
  line-height: 1.45;
  word-break: break-word;
}

.user-tag-shell {
  display: flex;
  gap: 6px;
}

.user-meta-shell-loading {
  margin-top: 1rem;
}
</style>
