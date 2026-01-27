<template>
  <Teleport to="body">
    <Transition
      @enter="onEnter"
      @leave="onLeave"
      :css="false"
    >
      <div 
        v-if="modelValue" 
        class="base-modal-backdrop"
        @click="handleBackdropClick"
      >
        <div class="base-modal-card" @click.stop>
          
          <header v-if="title" class="base-modal-header">
            <span class="base-modal-title">{{ title }}</span>
          </header>

          <div class="base-modal-body"><slot></slot></div>
          
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import gsap from 'gsap';

const props = defineProps<{
  modelValue: boolean;
  title?: string;
}>();

const emit = defineEmits(['update:modelValue', 'close', 'opened']);

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleBackdropClick = () => {
  close();
};

const onEnter = (el: Element, done: () => void) => {
  const card = el.querySelector('.base-modal-card');
  const tl = gsap.timeline({ 
    onComplete: () => {
      done();
      emit('opened');
    } 
  });
  tl.fromTo(el, 
    { opacity: 0 },
    { 
      opacity: 1, 
      duration: 0.4, 
      ease: 'power2.out' 
    }
  );

  tl.fromTo(card,
    { opacity: 0, y: 10, scale: 0.98 }, 
    { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      duration: 0.4, 
      ease: 'back.out(1.6)'
    },
    '<'
  );
};

const onLeave = (el: Element, done: () => void) => {
  const card = el.querySelector('.base-modal-card');
  const tl = gsap.timeline({ onComplete: done });

  tl.to(card, { 
    opacity: 0, 
    y: 10, 
    scale: 0.98,
    duration: 0.4, 
    ease: 'power2.in' 
  });

  tl.to(el, { 
    opacity: 0, 
    duration: 0.4
  }, '<');
};
</script>
