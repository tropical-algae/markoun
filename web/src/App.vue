<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" :key="$route.path" />
  </RouterView>
  <Notification/>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import Notification from "@/components/common/Notification.vue";
</script>