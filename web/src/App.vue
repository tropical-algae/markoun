<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" />
  </RouterView>
  <Toast />
  <PageTransition />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import PageTransition from '@/components/overlay/PageTransition.vue'
import Toast from '@/components/overlay/toast/Toast.vue'
</script>
