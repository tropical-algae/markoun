<template>
  <span
    class="tooltip-anchor"
    :class="`tooltip-anchor-${placement}`"
    :aria-describedby="shouldShowTooltip ? tooltipId : undefined"
  >
    <slot></slot>
    <span
      v-if="shouldShowTooltip"
      :id="tooltipId"
      role="tooltip"
      class="tooltip-bubble"
    >
      {{ text }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { useAppearanceStore } from '@/stores/appearance'

type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

const props = withDefaults(defineProps<{
  text: string
  placement?: TooltipPlacement
}>(), {
  placement: 'top',
})

const appearanceStore = useAppearanceStore()
const tooltipId = useId()
const shouldShowTooltip = computed(() => appearanceStore.showTooltips && props.text.length > 0)
</script>

<style scoped>
.tooltip-anchor {
  position: relative;
  display: inline-flex;
  width: max-content;
  max-width: 100%;
}

.tooltip-bubble {
  position: absolute;
  z-index: var(--tooltip-z-index);
  width: max-content;
  max-width: var(--tooltip-max-width);
  padding: var(--tooltip-padding);
  border-radius: var(--tooltip-radius);
  background-color: var(--color-tooltip-bg);
  color: var(--color-tooltip-text);
  box-shadow: 0 var(--tooltip-shadow-y) var(--tooltip-shadow-blur) var(--color-text-pri-shadow);
  font-size: var(--tooltip-font-size);
  line-height: var(--tooltip-line-height);
  /* white-space: normal; */
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

.tooltip-bubble::after {
  position: absolute;
  width: var(--tooltip-arrow-size);
  height: var(--tooltip-arrow-size);
  background-color: inherit;
  content: "";
  transform: rotate(45deg);
}

.tooltip-anchor:hover .tooltip-bubble,
.tooltip-anchor:has(:focus-visible) .tooltip-bubble {
  transform: var(--tooltip-open-transform);
  opacity: 1;
  visibility: visible;
}

.tooltip-anchor-top .tooltip-bubble {
  bottom: calc(100% + var(--tooltip-gap));
  left: 50%;
}

.tooltip-anchor-top .tooltip-bubble::after {
  bottom: calc(var(--tooltip-arrow-size) / -2);
  left: calc(50% - var(--tooltip-arrow-size) / 2);
}

.tooltip-anchor-right .tooltip-bubble {
  top: 50%;
  left: calc(100% + var(--tooltip-gap));
}

.tooltip-anchor-right .tooltip-bubble::after {
  top: calc(50% - var(--tooltip-arrow-size) / 2);
  left: calc(var(--tooltip-arrow-size) / -2);
}

.tooltip-anchor-bottom .tooltip-bubble {
  top: calc(100% + var(--tooltip-gap));
  left: 50%;
}

.tooltip-anchor-bottom .tooltip-bubble::after {
  top: calc(var(--tooltip-arrow-size) / -2);
  left: calc(50% - var(--tooltip-arrow-size) / 2);
}

.tooltip-anchor-left .tooltip-bubble {
  top: 50%;
  right: calc(100% + var(--tooltip-gap));
}

.tooltip-anchor-left .tooltip-bubble::after {
  top: calc(50% - var(--tooltip-arrow-size) / 2);
  right: calc(var(--tooltip-arrow-size) / -2);
}

.tooltip-anchor-top {
  --tooltip-hidden-transform: translateX(-50%) translateY(var(--tooltip-bounce-distance)) scale(var(--tooltip-bounce-start-scale));
  --tooltip-open-transform: translateX(-50%) translateY(0);
  --tooltip-transform-origin: 50% 100%;
}

.tooltip-anchor-right {
  --tooltip-hidden-transform: translateY(-50%) translateX(calc(var(--tooltip-bounce-distance) * -1)) scale(var(--tooltip-bounce-start-scale));
  --tooltip-open-transform: translateY(-50%) translateX(0);
  --tooltip-transform-origin: 0 50%;
}

.tooltip-anchor-bottom {
  --tooltip-hidden-transform: translateX(-50%) translateY(calc(var(--tooltip-bounce-distance) * -1)) scale(var(--tooltip-bounce-start-scale));
  --tooltip-open-transform: translateX(-50%) translateY(0);
  --tooltip-transform-origin: 50% 0;
}

.tooltip-anchor-left {
  --tooltip-hidden-transform: translateY(-50%) translateX(var(--tooltip-bounce-distance)) scale(var(--tooltip-bounce-start-scale));
  --tooltip-open-transform: translateY(-50%) translateX(0);
  --tooltip-transform-origin: 100% 50%;
}
</style>
