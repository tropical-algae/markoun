<template>
  <Transition :name="transitionName" :mode="transitionMode">
    <component v-if="gate.showLoading.value" :is="tag" key="loading" v-bind="attrs">
      <slot name="loading" />
    </component>

    <component
      v-else-if="gate.showError.value && hasErrorSlot"
      :is="tag"
      key="error"
      v-bind="attrs"
    >
      <slot name="error" />
    </component>

    <component
      v-else-if="gate.showEmpty.value && hasEmptySlot"
      :is="tag"
      key="empty"
      v-bind="attrs"
    >
      <slot name="empty" />
    </component>

    <component
      v-else-if="gate.showContent.value"
      :is="tag"
      key="content"
      v-bind="attrs"
    >
      <slot />
    </component>
  </Transition>
</template>

<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue'
import { useAsyncGate } from '@/composables/useAsyncGate'
import type { AsyncStatus } from '@/types/async'

defineOptions({
  inheritAttrs: false,
})

interface Props {
  status: AsyncStatus
  isEmpty?: boolean
  showDelayMs?: number
  minVisibleMs?: number
  loadingOnRefreshing?: boolean
  tag?: string
  transitionName?: string
  transitionMode?: 'out-in' | 'in-out'
}

const props = withDefaults(defineProps<Props>(), {
  isEmpty: false,
  showDelayMs: undefined,
  minVisibleMs: undefined,
  loadingOnRefreshing: true,
  tag: 'div',
  transitionName: 'soft-swap',
  transitionMode: 'out-in',
})

const attrs = useAttrs()
const slots = useSlots()
const hasEmptySlot = computed(() => Boolean(slots.empty))
const hasErrorSlot = computed(() => Boolean(slots.error))

const gate = useAsyncGate({
  status: computed(() => props.status),
  isEmpty: computed(() => props.isEmpty),
  showDelayMs: computed(() => props.showDelayMs),
  minVisibleMs: computed(() => props.minVisibleMs),
  loadingOnRefreshing: computed(() => props.loadingOnRefreshing),
})
</script>
