<template>
  <Teleport to="body">
    <div
      ref="menuRef"
      class="context-menu touch-scroll"
      role="menu"
      :aria-label="label"
      @contextmenu.prevent
      @keydown="handleKeydown"
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { readCssLengthPx } from '@/utils/css'
import { getViewportBounds } from '@/utils/viewport'

const props = defineProps<{
  label: string
  point: { x: number, y: number }
  align?: 'start' | 'end'
}>()

const emit = defineEmits<{
  (event: 'dismiss', restoreFocus: boolean): void
}>()

const menuRef = ref<HTMLElement | null>(null)
const menuItems = () => Array.from(
  menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [],
)

const placeMenu = () => {
  const menu = menuRef.value
  if (!menu) return
  const viewport = getViewportBounds()
  const gap = readCssLengthPx('--space-sm', 8)
  menu.style.maxWidth = `${Math.max(0, viewport.right - viewport.left - gap * 2)}px`
  menu.style.maxHeight = `${Math.max(0, viewport.bottom - viewport.top - gap * 2)}px`
  const { width, height } = menu.getBoundingClientRect()
  const anchorLeft = props.align === 'end' ? props.point.x - width : props.point.x
  const left = Math.max(viewport.left + gap, Math.min(anchorLeft, viewport.right - gap - width))
  const top = Math.max(viewport.top + gap, Math.min(props.point.y, viewport.bottom - gap - height))
  menu.style.left = `${left}px`
  menu.style.top = `${top}px`
}

const focusMenu = () => {
  placeMenu()
  menuItems()[0]?.focus({ preventScroll: true })
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Tab') {
    emit('dismiss', true)
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    emit('dismiss', true)
    return
  }
  const items = menuItems()
  if (!items.length) return
  const index = items.indexOf(document.activeElement as HTMLElement)
  let next: number
  switch (event.key) {
    case 'ArrowDown': next = (index + 1) % items.length; break
    case 'ArrowUp': next = (index - 1 + items.length) % items.length; break
    case 'Home': next = 0; break
    case 'End': next = items.length - 1; break
    default: return
  }
  event.preventDefault()
  items[next]?.focus()
}

const dismissOutside = (event: PointerEvent) => {
  if (event.target instanceof Node && !menuRef.value?.contains(event.target)) {
    emit('dismiss', false)
  }
}

onMounted(() => {
  focusMenu()
  document.addEventListener('pointerdown', dismissOutside, true)
  window.addEventListener('resize', placeMenu)
  window.visualViewport?.addEventListener('resize', placeMenu)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', dismissOutside, true)
  window.removeEventListener('resize', placeMenu)
  window.visualViewport?.removeEventListener('resize', placeMenu)
})
watch(() => props.point, focusMenu, { flush: 'post' })
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: var(--context-menu-z-index);
  box-sizing: border-box;
  width: max-content;
  padding: var(--space-xs);
  border: var(--line-width) solid var(--color-line);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-pri);
  color: var(--color-text-pri);
  overflow: auto;
}

:slotted(.context-menu-item) {
  display: block;
  width: 100%;
  padding: var(--space-xs) var(--space-md);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: inherit;
  text-align: start;
  font: inherit;
  cursor: pointer;
}

:slotted(.context-menu-item:focus-visible) {
  background-color: var(--color-action-light);
  outline: var(--line-width) solid var(--color-action);
  outline-offset: calc(-1 * var(--line-width));
}

:slotted(.context-menu-item.is-danger:focus-visible) {
  background-color: var(--color-bg-error-shadow);
}

@media (hover: hover) {
  :slotted(.context-menu-item:hover) {
    background-color: var(--color-bg-selected);
  }

  :slotted(.context-menu-item.is-danger:hover) {
    background-color: var(--color-bg-error-shadow);
  }
}

@media (pointer: coarse) {
  :slotted(.context-menu-item) {
    min-height: var(--context-menu-touch-item-min-height);
  }
}
</style>
