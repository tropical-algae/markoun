<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" />
  </RouterView>
  <Toast />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from '@/components/overlay/toast/Toast.vue'
</script>
