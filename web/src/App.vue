<template>
  <div v-if="showBootstrapShell" class="app-shell">
    <div class="app-shell-card">
      <div class="app-shell-brand">MARKOUN.</div>
      <div class="app-shell-status">
        <span class="app-shell-spinner" aria-hidden="true"></span>
        <span>Preparing workspace...</span>
      </div>
    </div>
  </div>
  <RouterView v-else v-slot="{ Component }">
    <component :is="Component" :key="$route.path" />
  </RouterView>
  <Toast/>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterView } from "vue-router";
import Toast from "@/components/overlay/toast/Toast.vue";
import router from "@/router";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore()
const isRouterReady = ref(false)

const showBootstrapShell = computed(() => {
  return !isRouterReady.value || userStore.isCheckingAuth()
})

onMounted(async () => {
  await router.isReady()
  isRouterReady.value = true
})
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, #f3f8ff 0%, transparent 32%),
    radial-gradient(circle at bottom right, #f7f7f7 0%, transparent 36%),
    var(--color-bg-pri);
}

.app-shell-card {
  width: min(420px, calc(100vw - 48px));
  padding: 32px 28px;
  border: 1px solid var(--color-line);
  border-radius: 18px;
  background-color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(36, 36, 36, 0.08);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.app-shell-brand {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--color-text-pri);
}

.app-shell-status {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-sec);
  font-size: 0.95rem;
}

.app-shell-spinner {
  width: 0.95rem;
  height: 0.95rem;
  border-radius: 999px;
  border: 2px solid var(--color-action);
  border-right-color: transparent;
  animation: app-shell-spin 0.8s linear infinite;
}

@keyframes app-shell-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
