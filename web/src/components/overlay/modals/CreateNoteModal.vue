<template>
  <CreateNodeModal
    v-model="isVisible"
    title="New Note"
    input-label="Note Name"
    placeholder="e.g. my_note"
    hint="Created in the selected path. No extension needed."
    node-type="file"
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
