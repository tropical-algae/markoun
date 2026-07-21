<template>
  <Teleport to="body">
    <Transition
      @enter="onEnter"
      @leave="onLeave"
      :css="false"
      mode="out-in"
    >
      <div
        v-if="currentNotice"
        :key="currentNotice.id"
        class="notice-toast"
        :style="toastStyle"
      >
        <BaseIconText
          :text="currentNotice.message"
          :icon="config.icon"
          :color="config.textColor"
          font-size="var(--font-size-md)"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { computed, onBeforeUnmount, watch, type CSSProperties } from 'vue'
import { useToastStore } from '@/stores/toast'
import { readCssLengthPx, readCssNumber, readCssTimeMs } from '@/utils/css'

import BaseIconText from '@/components/base/BaseIconText.vue'

import ErrorIcon from '@/assets/icons/octagon-xmark.svg'
import WarningIcon from '@/assets/icons/triangle-warning.svg'
import InfoIcon from '@/assets/icons/info.svg'

const noticeMap = {
  error: {
    bgColor: 'var(--color-bg-error)',
    shadowColor: 'var(--color-bg-error-shadow)',
    textColor: 'var(--color-text-inverse)',
    icon: ErrorIcon,
  },
  warning: {
    bgColor: 'var(--color-bg-warning)',
    shadowColor: 'var(--color-bg-warning-shadow)',
    textColor: 'var(--color-text-inverse)',
    icon: WarningIcon,
  },
  info: {
    bgColor: 'var(--color-text-pri)',
    shadowColor: 'var(--color-text-pri-shadow)',
    textColor: 'var(--color-bg-pri)',
    icon: InfoIcon,
  },
}

const toastStore = useToastStore()
const currentNotice = computed(() => toastStore.queue[0])
const config = computed(() => noticeMap[currentNotice.value?.type || 'info'])
const toastStyle = computed<CSSProperties>(() => ({
  backgroundColor: config.value.bgColor,
  boxShadow: `0 0 var(--toast-shadow-blur) ${config.value.shadowColor}`,
}))

let timer: number | null = null

const clearTimer = () => {
  if (timer !== null) {
    window.clearTimeout(timer)
    timer = null
  }
}

const getToastMotion = () => ({
  lifeMs: readCssTimeMs('--toast-life-ms', 5000),
  enterY: readCssLengthPx('--toast-enter-y', 20),
  leaveY: readCssLengthPx('--toast-leave-y', -20),
  enterDuration: readCssNumber('--motion-toast-enter-duration', 0.4),
  leaveDuration: readCssNumber('--motion-toast-leave-duration', 0.25),
  enterOpacity: readCssNumber('--toast-enter-opacity', 0.95),
  scaleFrom: readCssNumber('--toast-motion-scale-from', 0.95),
})

watch(currentNotice, (val) => {
  clearTimer()

  if (!val) {
    return
  }

  timer = window.setTimeout(() => {
    if (toastStore.queue[0]?.id === val.id) {
      toastStore.popNotice()
    }
  }, getToastMotion().lifeMs)
})

onBeforeUnmount(() => {
  clearTimer()
})

const onEnter = (el: Element, done: () => void) => {
  const motion = getToastMotion()
  gsap.set(el, { xPercent: -50, x: 0 })
  gsap.fromTo(el,
    {
      y: motion.enterY,
      opacity: 0,
      scale: motion.scaleFrom,
    },
    {
      y: 0,
      opacity: motion.enterOpacity,
      scale: 1,
      duration: motion.enterDuration,
      ease: 'back.out(1.6)',
      onComplete: done,
    }
  )
}

const onLeave = (el: Element, done: () => void) => {
  const motion = getToastMotion()
  gsap.to(el, {
    y: motion.leaveY,
    opacity: 0,
    scale: motion.scaleFrom,
    duration: motion.leaveDuration,
    ease: 'power2.in',
    onComplete: done,
  })
}
</script>

<style scoped>
.notice-toast {
  position: fixed;
  bottom: calc(var(--toast-bottom) + var(--safe-area-bottom));
  left: 50%;
  z-index: var(--toast-z-index);

  padding: var(--toast-padding);
  border-radius: var(--radius-md);

  max-width: var(--toast-max-width);
  backdrop-filter: blur(var(--toast-backdrop-blur));
}
</style>
