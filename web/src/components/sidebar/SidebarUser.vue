<template>
  <SidebarPanelLayout class="user-sidebar" title="Account">
    <div class="user-sidebar-body sidebar-panel-body">
      <section class="sidebar-section">
        <div class="sidebar-section-title f-m">Profile</div>
        <SidebarUserProfile />
      </section>

      <SidebarUserSecurity :after-update="handleLogout" />
    </div>

    <template #footer>
      <div class="user-sidebar-footer sidebar-panel-footer horizontal-line-top fc-pri">
        <GhostButton
          class="user-action-button f-s"
          theme="danger"
          :disabled="isLogoutButtonPending"
          :loading="isLogoutButtonPending"
          @click="handleLogout"
        >
          Logout
        </GhostButton>
      </div>
    </template>
  </SidebarPanelLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import router from '@/router'
import { useNodeStore } from '@/stores/note'
import { useUserStore } from '@/stores/user'

import GhostButton from '@/components/base/GhostButton.vue'
import SidebarUserProfile from '@/components/sidebar/SidebarUserProfile.vue'
import SidebarUserSecurity from '@/components/sidebar/SidebarUserSecurity.vue'
import SidebarPanelLayout from '@/layouts/SidebarPanelLayout.vue'

const userStore = useUserStore()
const nodeStore = useNodeStore()
const isLogoutFlowPending = ref(false)
const isLogoutButtonPending = computed(() =>
  isLogoutFlowPending.value || userStore.isLogoutPending()
)

const handleLogout = async () => {
  if (isLogoutFlowPending.value) {
    return
  }

  isLogoutFlowPending.value = true
  try {
    await nodeStore.saveCurrentFileIfDirty()
    const isDone = await userStore.logout()
    if (isDone) {
      await router.replace({ name: 'Login' })
    }
  } catch (_) {
  } finally {
    isLogoutFlowPending.value = false
  }
}
</script>

<style scoped>
.user-sidebar-body {
  min-height: 0;
}

.user-action-button {
  width: 100%;
}
</style>
