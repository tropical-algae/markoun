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
        :style="{ backgroundColor: config.bgColor, boxShadow: `0 0 var(--toast-shadow-blur) ${config.shadowColor}` }"
      >
        <BaseIconText 
          :text="currentNotice.message" 
          :icon="config.icon"
          :color="config.textColor"
          font-size="0.9rem" 
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import gsap from 'gsap';
import { computed, watch } from 'vue';
import { useToastStore } from '@/stores/toast';
import { readRootCssNumber } from '@/utils/css-vars';

import BaseIconText from '@/components/base/BaseIconText.vue';

import ErrorIcon from '@/assets/icons/octagon-xmark.svg';
import WarningIcon from '@/assets/icons/triangle-warning.svg';
import InfoIcon from '@/assets/icons/info.svg';

const noticeMap = {
  error: {
    bgColor: 'var(--color-bg-error)',
    shadowColor: 'var(--color-bg-error-shadow)',
    textColor: 'var(--color-text-inverse)',
    icon: ErrorIcon
  },
  warning: {
    bgColor: 'var(--color-bg-warning)',
    shadowColor: 'var(--color-bg-warning-shadow)',
    textColor: 'var(--color-text-inverse)',
    icon: WarningIcon
  },
  info: {
    bgColor: 'var(--color-text-pri)',
    shadowColor: 'var(--color-text-pri-shadow)',
    textColor: 'var(--color-bg-pri)',
    icon: InfoIcon
  }
};

const toastStore = useToastStore();
const currentNotice = computed(() => toastStore.queue[0]);
const config = computed(() => noticeMap[currentNotice.value?.type || 'info']);

let timer: number | null = null;

watch(currentNotice, (val) => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  if (!val) return;

  timer = setTimeout(() => {
    if (toastStore.queue[0]?.id === val.id) {
      toastStore.popNotice();
    }
  }, readRootCssNumber('--toast-life-ms', 5000));
});

const onEnter = (el: Element, done: () => void) => {
  gsap.set(el, { xPercent: -50, x: 0 }); 
  gsap.fromTo(el, 
    { 
      y: readRootCssNumber('--toast-enter-y', 20),
      opacity: 0,
      scale: 0.95
    },
    { 
      y: 0,
      opacity: 0.95, 
      scale: 1,
      duration: readRootCssNumber('--motion-toast-enter-duration', 0.4),
      ease: 'back.out(1.6)',
      onComplete: done 
    }
  );
};

const onLeave = (el: Element, done: () => void) => {
  gsap.to(el, { 
    y: readRootCssNumber('--toast-leave-y', -20),
    opacity: 0, 
    scale: 0.95,
    duration: readRootCssNumber('--motion-toast-leave-duration', 0.25),
    ease: 'power2.in',
    onComplete: done 
  });
};
</script>

<style scoped>
.notice-toast {
  position: fixed;
  bottom: var(--toast-bottom);
  left: 50%;
  z-index: var(--toast-z-index);
  
  padding: var(--toast-padding);
  border-radius: var(--toast-radius);
  
  max-width: var(--toast-max-width);
  /* min-width: 200px; */
  backdrop-filter: blur(2px);
}
</style>
