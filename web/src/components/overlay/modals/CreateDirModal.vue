<template>
  <CreateNodeModal
    v-model="isVisible"
    title="New Folder"
    input-label="Folder Name"
    placeholder="e.g. temp_folder"
    hint="Created in the selected path."
    node-type="dir"
  />
</template>

<script setup lang="ts">
import CreateNodeModal from '@/components/overlay/modals/CreateNodeModal.vue'
import { useModelProxy } from '@/composables/useModelProxy'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const isVisible = useModelProxy(props, emit)
</script>
