<template>
  <section class="sidebar-section">
    <div class="sidebar-section-title f-m">Security</div>

    <div class="password-fields">
      <UnderlinedInput
        v-model="passwordForm.newPassword"
        label="New password"
        type="password"
        class="password-input f-s"
        placeholder="Enter new password"
      />
      <UnderlinedInput
        v-model="passwordForm.confirmPassword"
        label="Confirm password"
        type="password"
        class="password-input is-confirm f-s"
        placeholder="Confirm new password"
      />

      <BaseIconText
        :icon="InfoIcon"
        :text="passwordHint"
        color="var(--color-bg-error)"
        class="password-hint"
        :class="{ 'is-visible': showPasswordHint }"
      />
    </div>

    <GhostButton
      class="user-action-button f-s"
      :disabled="!isPasswordValid || isUpdatePending"
      :loading="isUpdatePending"
      @click="updatePassword"
    >
      Update Password
    </GhostButton>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useUserStore } from '@/stores/user'

import BaseIconText from '@/components/base/BaseIconText.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import UnderlinedInput from '@/components/base/UnderlinedInput.vue'
import InfoIcon from '@/assets/icons/info.svg'

const props = defineProps<{
  afterUpdate: () => Promise<void>
}>()

const userStore = useUserStore()
const passwordForm = reactive({
  newPassword: '',
  confirmPassword: '',
})
const isUpdateFlowPending = ref(false)

const isUpdatePending = computed(() =>
  isUpdateFlowPending.value || userStore.isUpdatePasswordPending()
)
const isPasswordLongEnough = computed(() => passwordForm.newPassword.length >= 6)
const doPasswordsMatch = computed(
  () => passwordForm.newPassword === passwordForm.confirmPassword,
)
const isPasswordValid = computed(
  () => isPasswordLongEnough.value && doPasswordsMatch.value,
)
const showPasswordHint = computed(() =>
  Boolean(passwordForm.newPassword && passwordForm.confirmPassword) && !isPasswordValid.value
)
const passwordHint = computed(() =>
  isPasswordLongEnough.value
    ? 'Passwords do not match.'
    : 'Password must be longer than 6.'
)

const updatePassword = async () => {
  if (isUpdateFlowPending.value || !isPasswordValid.value) {
    return
  }

  isUpdateFlowPending.value = true
  try {
    const isUpdated = await userStore.updatePassword(passwordForm.newPassword)
    if (isUpdated) {
      await props.afterUpdate()
    }
  } finally {
    isUpdateFlowPending.value = false
  }
}
</script>

<style scoped>
.password-fields {
  margin-bottom: var(--space-lg);
}

.password-input {
  margin-bottom: var(--space-lg);
}

.password-input.is-confirm {
  margin-bottom: var(--space-xs);
}

.user-action-button {
  width: 100%;
}

.password-hint {
  opacity: 0;
  transition: opacity var(--motion-soft-duration) ease;
}

.password-hint.is-visible {
  opacity: 1;
}
</style>
