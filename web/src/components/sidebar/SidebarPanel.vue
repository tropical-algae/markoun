<template>
  <SidebarFileTree
    v-if="currentMode === SidebarMode.FileTree"
    @node-opened="emit('nodeOpened')"
  />
  <SidebarSearch
    v-else-if="currentMode === SidebarMode.Search"
    @node-opened="emit('nodeOpened')"
  />
  <SidebarUser v-else-if="currentMode === SidebarMode.User" />
  <SidebarSetting v-else />
</template>

<script setup lang="ts">
import { SidebarMode } from '@/types/ui'
import SidebarFileTree from '@/components/sidebar/SidebarFileTree.vue'
import SidebarSearch from '@/components/sidebar/SidebarSearch.vue'
import SidebarSetting from '@/components/sidebar/SidebarSetting.vue'
import SidebarUser from '@/components/sidebar/SidebarUser.vue'

defineProps<{
  currentMode: SidebarMode
}>()

const emit = defineEmits<{
  (event: 'nodeOpened'): void
}>()
</script>
