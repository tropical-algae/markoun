import { shallowRef } from 'vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import type { FsNode } from '@/types/file-system'

interface MenuTarget {
  node: FsNode
  trigger: HTMLElement
}

interface Point {
  x: number
  y: number
}

export const useFileTreeContextMenu = (getNode: (path: string) => FsNode | undefined) => {
  const menu = shallowRef<(MenuTarget & { point: Point, align?: 'end' }) | null>(null)
  const hasFinePointer = useMediaQuery('(any-pointer: fine)')

  const findTarget = (source: EventTarget | null): MenuTarget | null => {
    if (!(source instanceof Element)) return null
    const row = source.closest<HTMLElement>('[data-tree-node-path]')
    const path = row?.dataset.treeNodePath
    const node = path ? getNode(path) : undefined
    const trigger = source.closest<HTMLElement>('[aria-haspopup="menu"]')
      ?? row?.querySelector<HTMLElement>('[aria-haspopup="menu"]')
    return node && trigger ? { node, trigger } : null
  }

  const closeMenu = (restoreFocus = false) => {
    const trigger = menu.value?.trigger
    menu.value = null
    if (restoreFocus) trigger?.focus({ preventScroll: true })
  }

  const openAtTrigger = (target: MenuTarget) => {
    const { left, right, bottom } = target.trigger.getBoundingClientRect()
    const isMenuButton = target.trigger.hasAttribute('data-tree-menu-button')
    menu.value = {
      ...target,
      point: { x: isMenuButton ? right : left, y: bottom },
      align: isMenuButton ? 'end' : undefined,
    }
  }

  const handleContextMenu = (event: MouseEvent) => {
    if (!hasFinePointer.value || ('pointerType' in event && event.pointerType === 'touch')) {
      return
    }
    const target = findTarget(event.target)
    if (!target) return
    event.preventDefault()
    if (event.clientX || event.clientY) {
      menu.value = { ...target, point: { x: event.clientX, y: event.clientY } }
    } else {
      openAtTrigger(target)
    }
  }

  const handleContextKey = (event: KeyboardEvent) => {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return
    const target = findTarget(event.target)
    if (!target) return
    event.preventDefault()
    openAtTrigger(target)
  }

  const handleMenuButtonClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return
    const button = event.target.closest('[data-tree-menu-button]')
    const target = button && findTarget(button)
    if (target) openAtTrigger(target)
  }

  return { menu, closeMenu, handleContextMenu, handleContextKey, handleMenuButtonClick }
}
