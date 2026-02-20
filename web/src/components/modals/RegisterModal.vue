<template>
  <BaseModal 
    v-model="isVisible" 
    title="Registration"
    @opened="handleOpened"
  >
    <div style="width: 360px;">
      
      <InputUnderline
        v-model="registerForm.username"
        label="Full Name"
        ref="firstInputRef"
        type="text"
        class="mb-2 f-s"
        placeholder="e.g. John Doe"
        @keyup.enter="focusNext('emailInputRef')"
      />

      <InputUnderline
        v-model="registerForm.email"
        label="Email"
        ref="emailInputRef"
        type="email"
        class="mb-2 f-s"
        placeholder="name@example.com"
        @keyup.enter="focusNext('passwordInputRef')"
      />

      <InputUnderline
        v-model="registerForm.password"
        label="Password"
        ref="passwordInputRef"
        type="password"
        class="mb-4 f-s"
        placeholder="Enter your password"
        @keyup.enter="handleConfirm"
      />
      
      <div class="d-flex justify-content-end gap-2">
        <GhostButton class="f-s py-0" @click="isVisible = false" theme="secondary">Cancel</GhostButton>
        <GhostButton class="f-s py-0" @click="handleConfirm" :disabled="!isFormValied">Create Account</GhostButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import BaseModal from '@/components/common/BaseModal.vue';
import InputUnderline from '@/components/common/InputUnderline.vue';
import GhostButton from '@/components/common/GhostButton.vue';

import { useUserStore } from "@/scripts/stores/user"

const userStore = useUserStore()
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue', 'submit']);

const isVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const registerForm = reactive({
  username: '',
  email: '',
  password: ''
});

const isFormValied = computed(() => 
  registerForm.username.length >= 1 && registerForm.email.length >= 1 && registerForm.password.length >= 1
);

const firstInputRef = ref<InstanceType<typeof InputUnderline> | null>(null);
const emailInputRef = ref<InstanceType<typeof InputUnderline> | null>(null);
const passwordInputRef = ref<InstanceType<typeof InputUnderline> | null>(null);

const handleOpened = () => {
  firstInputRef.value?.focus();
}

const focusNext = (refName: 'emailInputRef' | 'passwordInputRef') => {
  if (refName === 'emailInputRef') emailInputRef.value?.focus();
  if (refName === 'passwordInputRef') passwordInputRef.value?.focus();
}

const handleConfirm = async () => {
  const isDone = await userStore.register(registerForm);
  if (isDone) {
    isVisible.value = false;
    resetForm();
  }
};

const resetForm = () => {
  registerForm.username = '';
  registerForm.email = '';
  registerForm.password = '';
}
</script>