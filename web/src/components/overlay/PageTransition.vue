<template>
  <Transition name="page-curtain" appear>
    <div v-if="transition.isActive" class="page-curtain">
      <div class="curtain-brand" aria-hidden="true">
        <span class="curtain-logo"></span>
        <span>MARKOUN.</span>
      </div>

      <div class="curtain-meter">
        <div class="curtain-readout" aria-hidden="true">
          <span class="curtain-label">Opening<br />workspace</span>
          <span class="curtain-percentage"><span ref="count">0</span><span>%</span></span>
        </div>
        <div
          class="curtain-track"
          role="progressbar"
          aria-label="Opening workspace"
          :aria-valuenow="transition.progress ?? 0"
        >
          <div ref="fill" class="curtain-fill"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, useTemplateRef, watch } from 'vue'
import gsap from 'gsap'
import { usePageTransitionStore } from '@/stores/page-transition'
import { readCssTimeMs } from '@/utils/css'

const transition = usePageTransitionStore()
const count = useTemplateRef<HTMLElement>('count')
const fill = useTemplateRef<HTMLElement>('fill')
const meter = { value: 0 }
let tween: gsap.core.Tween | undefined

watch(() => transition.progress, (progress) => {
  tween?.kill()
  if (progress === null) {
    meter.value = 0
    return
  }

  const countElement = count.value
  const fillElement = fill.value
  if (!countElement || !fillElement) return

  // Update only the readout and the bar, without scheduling a Vue render per frame.
  const draw = () => {
    const text = String(Math.floor(meter.value))
    if (countElement.textContent !== text) countElement.textContent = text
    fillElement.style.transform = `scaleX(${meter.value / 100})`
  }
  const complete = () => {
    if (progress === 100) transition.dismiss()
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    meter.value = progress
    draw()
    complete()
    return
  }

  draw()
  tween = gsap.to(meter, {
    value: progress,
    ease: 'power2.out',
    duration: readCssTimeMs('--motion-page-transition-progress-duration', 190) / 1000,
    onUpdate: draw,
    onComplete: complete,
  })
}, { flush: 'post' })

onBeforeUnmount(() => tween?.kill())
</script>

<style scoped>
.curtain-brand {
  animation:
    curtain-brand-in var(--motion-page-transition-brand-duration)
      var(--motion-page-transition-brand-easing) var(--motion-page-transition-brand-delay) both,
    curtain-brand-fade var(--motion-soft-duration)
      ease-in var(--motion-page-transition-brand-delay) both;
}

.curtain-meter {
  position: absolute;
  inset-inline: var(--page-transition-gutter);
  left: max(var(--page-transition-gutter), var(--safe-area-left));
  right: max(var(--page-transition-gutter), var(--safe-area-right));
  bottom: calc(var(--page-transition-gutter) + var(--safe-area-bottom));
}

.curtain-readout {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-lg);
  margin-bottom: var(--space-sm);
}

.curtain-label {
  padding-block-end: var(--space-xs);
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.curtain-percentage {
  display: flex;
  align-items: baseline;
  font-size: var(--page-transition-percentage-font-size);
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.055em;
  line-height: 0.85;
}

.curtain-percentage > :last-child {
  font-size: 0.48em;
  letter-spacing: -0.03em;
  margin-inline-start: var(--space-xs);
}

.curtain-track {
  height: var(--progress-track-height);
  background-color: var(--color-page-transition-track);
}

.curtain-fill {
  height: 100%;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  will-change: transform;
}

.page-curtain-enter-active {
  transition: opacity var(--motion-page-transition-enter-duration) var(--motion-page-transition-easing);
}

.page-curtain-leave-active {
  transition: opacity var(--motion-page-transition-leave-duration) ease-in-out;
}

.page-curtain-enter-from,
.page-curtain-leave-to {
  opacity: 0;
}

@keyframes curtain-brand-in {
  from {
    transform: translateY(0.42em) scale(0.35, 0.4);
  }

  to {
    transform: translateY(0) scale(1);
  }
}

@keyframes curtain-brand-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .curtain-brand {
    animation: none;
  }

  .page-curtain-enter-active,
  .page-curtain-leave-active {
    transition: none;
  }
}
</style>
