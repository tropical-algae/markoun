<template>
  <InspectorFileMeta
    v-if="mode === InspectorMode.Meta"
    :status="nodeStore.currentFileStatus"
    :show-delay-ms="showDelayMs"
    :content-length="nodeStore.currentFile.content.length"
    :meta="nodeStore.currentFile.meta"
    @close="emit('close')"
  />

  <InspectorPreview
    v-else-if="mode === InspectorMode.Preview"
    :status="nodeStore.currentFileStatus"
    :show-delay-ms="showDelayMs"
    :rendered-html="nodeStore.currentRenderedFile"
    @close="emit('close')"
  />
</template>

<script setup lang="ts">
import { useNodeStore } from '@/stores/note'
import { InspectorMode, type InspectorMode as InspectorModeType } from '@/types/ui'
import { readCssTimeMs } from '@/utils/css'
import InspectorFileMeta from '@/components/inspector/InspectorFileMeta.vue'
import InspectorPreview from '@/components/inspector/InspectorPreview.vue'

defineProps<{
  mode: InspectorModeType
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const nodeStore = useNodeStore()
const showDelayMs = readCssTimeMs('--editor-async-gate-delay-ms', 0)
</script>
