<template>
  <Teleport to="body">
    <Transition name="modal" @after-enter="onAfterEnter">
      <div 
        v-if="modelValue" 
        class="base-modal-backdrop"
        @click="handleBackdropClick"
      >
        <div
          ref="modalCardRef"
          class="base-modal-card"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          tabindex="-1"
          @click.stop
        >
          
          <header v-if="title" class="base-modal-header">
            <span :id="titleId" class="base-modal-title f-l">{{ title }}</span>
          </header>

          <div class="base-modal-body"><slot></slot></div>
          
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean;
  title?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}>(), {
  closeOnBackdrop: true,
  closeOnEscape: true,
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'close'): void
  (event: 'opened'): void
}>();

const titleId = useId()
const modalCardRef = ref<HTMLElement | null>(null)
let previousActiveElement: HTMLElement | null = null

const close = () => {
  if (!props.modelValue) {
    return
  }

  emit('update:modelValue', false);
  emit('close');
};

const handleBackdropClick = () => {
  if (!props.closeOnBackdrop) {
    return
  }

  close();
};

const focusModalCard = async () => {
  await nextTick()
  modalCardRef.value?.focus({ preventScroll: true })
}

const restorePreviousFocus = () => {
  previousActiveElement?.focus({ preventScroll: true })
  previousActiveElement = null
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.closeOnEscape || event.key !== 'Escape') {
    return
  }

  event.stopPropagation()
  close()
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      previousActiveElement = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      window.addEventListener('keydown', handleKeydown)
      return
    }

    window.removeEventListener('keydown', handleKeydown)
    restorePreviousFocus()
  },
)

const onAfterEnter = () => {
  void focusModalCard()
  emit('opened');
};

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.base-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  background-color: var(--color-backdrop); 
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-font-smoothing: antialiased;
}

.base-modal-card {
  background-color: var(--color-bg-pri);
  box-shadow: 0 var(--modal-card-shadow-y) var(--modal-card-shadow-blur) var(--color-bg-pri-shadow);
  border-radius: var(--modal-radius);
  overflow: hidden;
  
  width: fit-content;
  height: fit-content;
  max-width: var(--modal-max-width);
  max-height: var(--modal-max-height);
  display: flex;
  flex-direction: column;
}

.base-modal-card:focus {
  outline: none;
}

.base-modal-header {
  padding: var(--modal-header-padding);
  border-bottom: 1px solid var(--color-line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--color-bg-sec);
}

.base-modal-title {
  font-weight: bold;
  color: var(--color-text-pri);
}

.base-modal-body {
  padding: var(--modal-body-padding);
  overflow-y: auto; 
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--motion-modal-duration) ease;
}

.modal-enter-active .base-modal-card {
  animation: card-enter var(--motion-modal-duration) ease forwards;
}

.modal-leave-active .base-modal-card {
  animation: card-leave var(--motion-modal-duration) ease-in forwards;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes card-enter {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes card-leave {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(10px);
  }
}
</style>
