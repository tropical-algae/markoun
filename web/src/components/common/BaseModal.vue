<template>
  <Teleport to="body">
    <Transition name="modal" @after-enter="onAfterEnter">
      <div 
        v-if="modelValue" 
        class="base-modal-backdrop"
        @click="handleBackdropClick"
      >
        <div class="base-modal-card" @click.stop>
          
          <header v-if="title" class="base-modal-header">
            <span class="base-modal-title f-l">{{ title }}</span>
          </header>

          <div class="base-modal-body"><slot></slot></div>
          
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
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

const onAfterEnter = () => {
  emit('opened');
};
</script>

