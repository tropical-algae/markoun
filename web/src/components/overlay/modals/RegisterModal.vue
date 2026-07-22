<template>
  <BaseModal
    v-model="isVisible"
    title="Registration"
    @opened="handleOpened"
  >
    <form @submit.prevent="handleConfirm">
      <ModalContentLayout>
        <UnderlinedInput
          v-model="registerForm.username"
          label="Full Name"
          ref="firstInputRef"
          type="text"
          name="username"
          autocomplete="username"
          required
          class="modal-field f-s"
          placeholder="e.g. John Doe"
          @keydown.enter.prevent="focusNext('emailInputRef')"
        />

        <UnderlinedInput
          v-model="registerForm.email"
          label="Email"
          ref="emailInputRef"
          type="email"
          name="email"
          autocomplete="email"
          required
          class="modal-field f-s"
          placeholder="name@example.com"
          @keydown.enter.prevent="focusNext('passwordInputRef')"
        />

        <UnderlinedInput
          v-model="registerForm.password"
          label="Password"
          ref="passwordInputRef"
          type="password"
          name="password"
          autocomplete="new-password"
          required
          class="modal-field is-last f-s"
          placeholder="Enter your password"
        />

        <template #actions>
          <GhostButton
            type="button"
            class="modal-button f-s"
            @click="isVisible = false"
            theme="secondary"
            :disabled="userStore.isRegisterPending()"
          >
            Cancel
          </GhostButton>
          <GhostButton
            type="submit"
            class="modal-button f-s"
            :disabled="!isFormValid || userStore.isRegisterPending()"
            :loading="userStore.isRegisterPending()"
          >
            Create Account
          </GhostButton>
        </template>
      </ModalContentLayout>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import UnderlinedInput from '@/components/base/UnderlinedInput.vue'
import GhostButton from '@/components/base/GhostButton.vue'
import ModalContentLayout from '@/layouts/ModalContentLayout.vue'

import { useUserStore } from '@/stores/user'
import { useModelProxy } from '@/composables/useModelProxy'

const userStore = useUserStore()
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const isVisible = useModelProxy(props, emit)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
})

const isFormValid = computed(() =>
  registerForm.username.length >= 1 &&
  registerForm.email.length >= 1 &&
  registerForm.password.length >= 1
)

const firstInputRef = ref<InstanceType<typeof UnderlinedInput> | null>(null)
const emailInputRef = ref<InstanceType<typeof UnderlinedInput> | null>(null)
const passwordInputRef = ref<InstanceType<typeof UnderlinedInput> | null>(null)

const handleOpened = () => {
  firstInputRef.value?.focus()
}

const focusNext = (refName: 'emailInputRef' | 'passwordInputRef') => {
  if (refName === 'emailInputRef') {
    emailInputRef.value?.focus()
    return
  }

  passwordInputRef.value?.focus()
}

const handleConfirm = async () => {
  if (!isFormValid.value || userStore.isRegisterPending()) {
    return
  }

  const isDone = await userStore.register(registerForm)
  if (isDone) {
    isVisible.value = false
    resetForm()
  }
}

const resetForm = () => {
  registerForm.username = ''
  registerForm.email = ''
  registerForm.password = ''
}
</script>
