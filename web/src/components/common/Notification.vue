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
        :style="{ backgroundColor: config.bgColor, boxShadow: `0 0 15px ${config.shadowColor}` }"
      >
        <TextHint 
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
import { useNoticeStore } from '@/scripts/stores/notice';
import TextHint from '@/components/common/TextHint.vue';

import ErrorIcon from '@/assets/icons/octagon-xmark.svg';
import WarningIcon from '@/assets/icons/triangle-warning.svg';
import InfoIcon from '@/assets/icons/info.svg';

const noticeMap = {
  error: {
    bgColor: 'var(--color-bg-error)',
    shadowColor: 'var(--color-bg-error-shadow)',
    textColor: '#ffffff',
    icon: ErrorIcon
  },
  warning: {
    bgColor: 'var(--color-bg-warning)',
    shadowColor: 'var(--color-bg-warning-shadow)',
    textColor: '#ffffff',
    icon: WarningIcon
  },
  info: {
    bgColor: 'var(--color-text-pri)',
    shadowColor: 'var(--color-text-pri-shadow)',
    textColor: 'var(--color-bg-pri)',
    icon: InfoIcon
  }
};

const noticeStore = useNoticeStore();
const currentNotice = computed(() => noticeStore.queue[0]);
const config = computed(() => noticeMap[currentNotice.value?.type || 'info']);

let timer: number | null = null;

watch(currentNotice, (val) => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  if (!val) return;

  timer = setTimeout(() => {
    if (noticeStore.queue[0]?.id === val.id) {
      noticeStore.popNotice();
    }
  }, 5000);
});

const onEnter = (el: Element, done: () => void) => {
  gsap.set(el, { xPercent: -50, x: 0 }); 
  gsap.fromTo(el, 
    { 
      y: 20,
      opacity: 0,
      scale: 0.95
    },
    { 
      y: 0,
      opacity: 0.95, 
      scale: 1,
      duration: 0.4, 
      ease: 'back.out(1.6)',
      onComplete: done 
    }
  );
};

const onLeave = (el: Element, done: () => void) => {
  gsap.to(el, { 
    y: -20,
    opacity: 0, 
    scale: 0.95,
    duration: 0.25,
    ease: 'power2.in',
    onComplete: done 
  });
};
</script>

<style scoped>
.notice-toast {
  position: fixed;
  bottom: 42px;
  left: 50%;
  z-index: 9999;
  
  padding: 10px 16px;
  border-radius: 8px;
  
  max-width: 80vw;
  min-width: 200px;
  backdrop-filter: blur(2px);
}
</style>