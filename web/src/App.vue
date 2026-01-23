<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" :key="$route.path" />
  </RouterView>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";

</script>