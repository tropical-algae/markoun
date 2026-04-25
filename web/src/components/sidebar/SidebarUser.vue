<template>
  <div class="d-flex flex-column h-100">
    <BaseHeader>
      <div class="f-m fw-bold text-uppercase">Account</div>
    </BaseHeader>

    <div class="container-fluid flex-grow-1 overflow-y-scroll py-2 user-sidebar-body">
      <section class="mb-5">
        <div class="text-uppercase fw-bold mb-3 f-m">Profile</div>

        <Transition name="soft-swap" mode="out-in">
          <div v-if="showProfileSkeleton" key="profile-skeleton" class="user-profile-shell">
            <BaseSkeleton width="52%" height="1.1rem" />
            <BaseSkeleton width="68%" height="0.85rem" />

            <div class="user-tag-shell">
              <BaseSkeleton width="56px" height="1.2rem" radius="4px" />
              <BaseSkeleton width="44px" height="1.2rem" radius="4px" />
            </div>

            <div class="user-meta-shell">
              <div v-for="index in 2" :key="index" class="user-meta-shell-row">
                <BaseSkeleton width="60px" height="0.7rem" />
                <BaseSkeleton width="110px" height="0.8rem" />
              </div>
            </div>
          </div>

          <div v-else-if="userStore.currentUserProfile" key="profile-card" class="user-profile-card">
            <div class="user-name f-m fw-bold">
              {{ userStore.currentUserProfile.full_name || 'Unnamed user' }}
            </div>
            <div class="user-email f-s">
              {{ userStore.currentUserProfile.email }}
            </div>

            <div class="user-meta-grid mt-3">
              <span class="user-meta-label f-s">Scopes</span>
              <div class="user-scopes">
                <span
                  v-for="scope in userStore.currentUserProfile.scopes"
                  :key="scope"
                  class="meta-tag"
                >
                  {{ scope }}
                </span>
              </div>

              <span class="user-meta-label f-s">Status</span>
              <span class="user-meta-value f-s">
                {{ userStore.currentUserProfile.is_active ? 'Active' : 'Inactive' }}
              </span>

              <span class="user-meta-label f-s">Joined</span>
              <span class="user-meta-value f-s">
                {{ userStore.currentUserProfile.joined_at || 'Unknown' }}
              </span>
            </div>
          </div>

          <div v-else key="profile-empty" class="user-profile-empty f-s">
            User information is temporarily unavailable.
          </div>
        </Transition>
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
import { computed, onMounted, reactive } from 'vue';
import router from '@/router';
import { useUserStore } from '@/stores/user';

import BaseHeader from '@/components/base/BaseHeader.vue';
import BaseIconText from '@/components/base/BaseIconText.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import GhostButton from '@/components/base/GhostButton.vue';
import UnderlinedInput from '@/components/base/UnderlinedInput.vue';

import InfoIcon from '@/assets/icons/info.svg';

const userStore = useUserStore()

const pwdForm = reactive({
  new: '',
  confirm: '',
})

const showProfileSkeleton = computed(() => {
  return (
    userStore.currentUserProfileState === 'loading' &&
    userStore.currentUserProfile === null
  )
})
const isPwdLenValid = computed(() => pwdForm.new.length >= 6)
const isPwdConfValid = computed(() => pwdForm.new === pwdForm.confirm)
const showPasswordHint = computed(() => {
  return Boolean(pwdForm.new && pwdForm.confirm) && (!isPwdLenValid.value || !isPwdConfValid.value)
})
const passwordHint = computed(() => {
  return !isPwdLenValid.value ? 'Password must be longer than 6.' : 'Passwords do not match.'
})

onMounted(() => {
  void userStore.refreshCurrentUserProfile().catch(() => null)
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
  /* align-items: center;
  vertical-align: middle; */
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

.user-meta-shell-row {
  display: contents;
}
</style>
