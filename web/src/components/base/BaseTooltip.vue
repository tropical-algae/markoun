<template>
  <span
    ref="anchorRef"
    class="tooltip-anchor"
    :class="[{ 'is-block': block }, `tooltip-anchor-${placement}`]"
    :aria-describedby="isActive ? tooltipId : undefined"
    @pointerenter="handlePointerEnter"
    @pointerleave="handlePointerLeave"
    @focusin="handleFocusIn"
    @focusout="closeTooltip"
  >
    <slot></slot>

    <Teleport to="body">
      <span
        v-if="showBubble"
        :id="tooltipId"
        ref="bubbleRef"
        role="tooltip"
        class="tooltip-bubble"
        :class="[
          `tooltip-bubble-${placement}`,
          { 'is-open': isActive },
        ]"
        :style="tooltipStyle"
      >
        {{ text }}
      </span>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useId,
  watch,
} from 'vue'
import { useAppearanceStore } from '@/stores/appearance'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { readCssTimeMs } from '@/utils/css'
import {
  useTooltipPosition,
  type TooltipPlacement,
} from '@/composables/useTooltipPosition'

const props = withDefaults(defineProps<{
  text: string
  placement?: TooltipPlacement
  block?: boolean
}>(), {
  placement: 'top',
  block: false,
})

const appearanceStore = useAppearanceStore()
const tooltipId = useId()
const shouldShowTooltip = computed(() => appearanceStore.showTooltips && props.text.length > 0)
const showBubble = computed(() => shouldShowTooltip.value && isRendered.value)

const anchorRef = ref<HTMLElement | null>(null)
const bubbleRef = ref<HTMLElement | null>(null)
const supportsHoverPointer = useMediaQuery('(hover: hover) and (pointer: fine)')
const isRendered = ref(false)
const isActive = ref(false)
const {
  tooltipStyle,
  updateTooltipPosition,
  addPositionListeners,
  removePositionListeners,
} = useTooltipPosition(anchorRef, bubbleRef, () => props.placement)

let closeTimer: number | null = null
let animationFrame: number | null = null

const clearCloseTimer = () => {
  if (closeTimer !== null) {
    window.clearTimeout(closeTimer)
    closeTimer = null
  }
}

const clearAnimationFrame = () => {
  if (animationFrame !== null) {
    window.cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

const openTooltip = async () => {
  if (!shouldShowTooltip.value) {
    return
  }

  clearCloseTimer()
  clearAnimationFrame()
  isRendered.value = true
  await nextTick()
  updateTooltipPosition()
  addPositionListeners()
  animationFrame = window.requestAnimationFrame(() => {
    animationFrame = null
    isActive.value = true
  })
}

const handlePointerEnter = (event: PointerEvent) => {
  if (!supportsHoverPointer.value || event.pointerType === 'touch') {
    return
  }

  void openTooltip()
}

const handlePointerLeave = (event: PointerEvent) => {
  if (event.pointerType === 'touch') {
    return
  }

  closeTooltip()
}

const closeTooltip = () => {
  clearAnimationFrame()
  isActive.value = false
  removePositionListeners()
  clearCloseTimer()
  closeTimer = window.setTimeout(() => {
    closeTimer = null
    isRendered.value = false
  }, readCssTimeMs('--motion-tooltip-duration', 400))
}

const handleFocusIn = (event: FocusEvent) => {
  if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) {
    void openTooltip()
  }
}

watch(shouldShowTooltip, (isEnabled) => {
  if (!isEnabled) {
    closeTooltip()
  }
})

watch(supportsHoverPointer, (canHover) => {
  if (!canHover) {
    closeTooltip()
  }
})

onBeforeUnmount(() => {
  clearCloseTimer()
  clearAnimationFrame()
  removePositionListeners()
})
</script>

<style scoped>
.tooltip-anchor {
  position: relative;
  display: inline-flex;
  width: max-content;
  max-width: 100%;
}

.tooltip-anchor.is-block {
  display: flex;
  width: 100%;
}

.tooltip-bubble {
  position: fixed;
  z-index: var(--tooltip-z-index);
  --tooltip-arrow-offset: 50%;
  width: max-content;
  max-width: var(--tooltip-max-width);
  padding: var(--tooltip-padding);
  border-radius: var(--tooltip-radius);
  background-color: var(--color-tooltip-bg);
  color: var(--color-tooltip-text);
  box-shadow: 0 var(--tooltip-shadow-y) var(--tooltip-shadow-blur) var(--color-text-pri-shadow);
  font-size: var(--tooltip-font-size);
  line-height: var(--tooltip-line-height);
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-align: center;
  pointer-events: none;
  transform: var(--tooltip-hidden-transform);
  transform-origin: var(--tooltip-transform-origin);
  opacity: 0;
  visibility: hidden;
  will-change: transform, opacity;
  backface-visibility: hidden;
  transition:
    opacity var(--motion-tooltip-duration) ease,
    transform var(--motion-tooltip-duration) cubic-bezier(0.16, 1.35, 0.38, 1),
    visibility var(--motion-tooltip-duration) ease;
}

.tooltip-bubble.is-open {
  transform: var(--tooltip-open-transform);
  opacity: 1;
  visibility: visible;
}

.tooltip-bubble::after {
  position: absolute;
  width: var(--tooltip-arrow-size);
  height: var(--tooltip-arrow-size);
  background-color: inherit;
  content: "";
  transform: rotate(45deg);
}

.tooltip-bubble-top::after {
  bottom: calc(var(--tooltip-arrow-size) / -2);
  left: calc(var(--tooltip-arrow-offset) - var(--tooltip-arrow-size) / 2);
}

.tooltip-bubble-right::after {
  top: calc(var(--tooltip-arrow-offset) - var(--tooltip-arrow-size) / 2);
  left: calc(var(--tooltip-arrow-size) / -2);
}

.tooltip-bubble-bottom::after {
  top: calc(var(--tooltip-arrow-size) / -2);
  left: calc(var(--tooltip-arrow-offset) - var(--tooltip-arrow-size) / 2);
}

.tooltip-bubble-left::after {
  top: calc(var(--tooltip-arrow-offset) - var(--tooltip-arrow-size) / 2);
  right: calc(var(--tooltip-arrow-size) / -2);
}

.tooltip-bubble-top {
  --tooltip-hidden-transform: translateY(var(--tooltip-bounce-distance)) scale(var(--tooltip-bounce-start-scale));
  --tooltip-open-transform: translateY(0) scale(var(--tooltip-bounce-end-scale));
  --tooltip-transform-origin: 50% 100%;
}

.tooltip-bubble-right {
  --tooltip-hidden-transform: translateX(calc(var(--tooltip-bounce-distance) * -1)) scale(var(--tooltip-bounce-start-scale));
  --tooltip-open-transform: translateX(0) scale(var(--tooltip-bounce-end-scale));
  --tooltip-transform-origin: 0 50%;
}

.tooltip-bubble-bottom {
  --tooltip-hidden-transform: translateY(calc(var(--tooltip-bounce-distance) * -1)) scale(var(--tooltip-bounce-start-scale));
  --tooltip-open-transform: translateY(0) scale(var(--tooltip-bounce-end-scale));
  --tooltip-transform-origin: 50% 0;
}

.tooltip-bubble-left {
  --tooltip-hidden-transform: translateX(var(--tooltip-bounce-distance)) scale(var(--tooltip-bounce-start-scale));
  --tooltip-open-transform: translateX(0) scale(var(--tooltip-bounce-end-scale));
  --tooltip-transform-origin: 100% 50%;
}
</style>
