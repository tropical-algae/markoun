<template>
  <div
    ref="viewportRef"
    class="history-canvas"
    @pointerdown="startCanvasDrag"
    @pointermove="continueDrag"
    @pointerup="stopDrag"
    @pointercancel="stopDrag"
  >
    <div
      class="history-world"
      :class="{ 'is-measuring': !measurementsReady }"
      :style="worldStyle"
    >
      <svg
        class="history-links"
        :width="layout.width"
        :height="layout.height"
        aria-hidden="true"
      >
        <path
          v-for="link in links"
          :key="link.id"
          class="history-link"
          :d="link.path"
        />
      </svg>

      <div
        v-for="item in positionedNodes"
        :key="item.node.id"
        :ref="(element) => setNodeRef(item.node.id, element)"
        :data-node-id="item.node.id"
        class="history-node-position"
        :class="{ 'is-dragging': draggingNodeId === item.node.id }"
        :style="{ transform: `translate3d(${item.x}px, ${item.y}px, 0)` }"
        @pointerdown.stop="startNodeDrag(item.node.id, $event)"
      >
        <HistoryNodeCard
          :node="item.node"
          :selected="selectedRevisionId === item.node.id"
          :latest="defaultRevisionId === item.node.id"
          :pending="pendingRevisionId === item.node.id"
          :dragging="draggingNodeId === item.node.id"
          :disabled="disabled"
          @select="selectNode(item.node.id)"
          @delete="emit('delete', item.node)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  type CSSProperties,
} from 'vue'
import { stratify, tree } from 'd3-hierarchy'
import type { HistoryNode, HistoryTree } from '@/types/history'
import { readCssLengthPx } from '@/utils/css'
import HistoryNodeCard from '@/components/inspector/HistoryNodeCard.vue'

const props = defineProps<{
  tree: HistoryTree
  selectedRevisionId: string | null
  defaultRevisionId: string | null
  pendingRevisionId: string | null
  disabled: boolean
}>()

const emit = defineEmits<{
  (event: 'select', revisionId: string): void
  (event: 'delete', node: HistoryNode): void
}>()

interface Point {
  x: number
  y: number
}

interface ActiveDrag {
  kind: 'canvas' | 'node'
  pointerId: number
  target: HTMLElement
  nodeId?: string
  startClientX: number
  startClientY: number
  startX: number
  startY: number
  moved: boolean
  captured: boolean
}

const nodeWidth = readCssLengthPx('--history-node-width', 184)
const horizontalGap = readCssLengthPx('--history-tree-gap-x', 28)
const verticalGap = readCssLengthPx('--history-tree-gap-y', 44)
const worldPadding = readCssLengthPx('--history-canvas-padding', 28)
const dragThreshold = readCssLengthPx('--history-drag-threshold', 4)

const viewportRef = ref<HTMLElement | null>(null)
const viewportWidth = ref(0)
const nodeElements = new Map<string, HTMLElement>()
const nodeHeights = reactive(new Map<string, number>())
const pan = reactive<Point>({ x: 0, y: 0 })
const nodeOffsets = reactive(new Map<string, Point>())
const draggingNodeId = ref<string | null>(null)
const suppressedClickNodeId = ref<string | null>(null)
let activeDrag: ActiveDrag | null = null
let pendingPointer: Point | null = null
let dragFrame: number | null = null
let resizeObserver: ResizeObserver | null = null
let nodeResizeObserver: ResizeObserver | null = null
let initialTreeCentered = false

const setNodeRef = (nodeId: string, element: unknown) => {
  const previous = nodeElements.get(nodeId)
  if (previous === element) {
    return
  }
  if (previous) {
    nodeResizeObserver?.unobserve(previous)
  }
  if (!(element instanceof HTMLElement)) {
    nodeElements.delete(nodeId)
    return
  }
  nodeElements.set(nodeId, element)
  nodeResizeObserver?.observe(element)
}

const measurementsReady = computed(() => {
  return props.tree.nodes.every((node) => nodeHeights.has(node.id))
})

const layout = computed(() => {
  if (props.tree.nodes.length === 0) {
    return { nodes: [] as Array<{ node: HistoryNode; x: number; y: number }>, width: 0, height: 0 }
  }

  const root = stratify<HistoryNode>()
    .id((node) => node.id)
    .parentId((node) => node.parent_id)(props.tree.nodes)
  root.sort((left, right) => left.data.sequence - right.data.sequence)
  const positionedRoot = tree<HistoryNode>()
    .nodeSize([nodeWidth + horizontalGap, 1])(root)
  const descendants = positionedRoot.descendants()
  const minX = Math.min(...descendants.map((node) => node.x))
  const maxX = Math.max(...descendants.map((node) => node.x))
  const rowHeights = new Map<number, number>()
  for (const item of descendants) {
    rowHeights.set(
      item.depth,
      Math.max(rowHeights.get(item.depth) ?? 0, nodeHeights.get(item.data.id) ?? 0),
    )
  }
  const rowTops = new Map<number, number>()
  let nextTop = worldPadding
  for (let depth = 0; depth < rowHeights.size; depth += 1) {
    rowTops.set(depth, nextTop)
    nextTop += (rowHeights.get(depth) ?? 0) + verticalGap
  }

  return {
    nodes: descendants.map((node) => ({
      node: node.data,
      x: node.x - minX + worldPadding,
      y: rowTops.get(node.depth) ?? worldPadding,
    })),
    width: maxX - minX + nodeWidth + worldPadding * 2,
    height: nextTop - verticalGap + worldPadding,
  }
})

const positionedNodes = computed(() => {
  return layout.value.nodes.map((item) => {
    const offset = nodeOffsets.get(item.node.id)
    return {
      ...item,
      x: item.x + (offset?.x ?? 0),
      y: item.y + (offset?.y ?? 0),
    }
  })
})

const links = computed(() => {
  const byId = new Map(positionedNodes.value.map((item) => [item.node.id, item]))
  return positionedNodes.value.flatMap((target) => {
    if (!target.node.parent_id) {
      return []
    }
    const source = byId.get(target.node.parent_id)
    if (!source) {
      return []
    }
    const sourceX = source.x + nodeWidth / 2
    const sourceY = source.y + (nodeHeights.get(source.node.id) ?? 0)
    const targetX = target.x + nodeWidth / 2
    const targetY = target.y
    const middleY = (sourceY + targetY) / 2
    return [{
      id: `${source.node.id}:${target.node.id}`,
      path: `M ${sourceX} ${sourceY} C ${sourceX} ${middleY}, ${targetX} ${middleY}, ${targetX} ${targetY}`,
    }]
  })
})

const worldStyle = computed<CSSProperties>(() => ({
  width: `${layout.value.width}px`,
  height: `${layout.value.height}px`,
  transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
}))

const centerTree = () => {
  pan.x = Math.max(0, (viewportWidth.value - layout.value.width) / 2)
  pan.y = 0
}

const resetView = () => {
  nodeOffsets.clear()
  centerTree()
}

defineExpose({ resetView })

const beginDrag = (
  kind: ActiveDrag['kind'],
  event: PointerEvent,
  nodeId?: string,
) => {
  if (event.button !== 0 || props.disabled) {
    return
  }
  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) {
    return
  }
  const origin = nodeId ? nodeOffsets.get(nodeId) : pan
  const captured = kind === 'canvas'
  if (captured) {
    target.setPointerCapture(event.pointerId)
  }
  activeDrag = {
    kind,
    pointerId: event.pointerId,
    target,
    nodeId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: origin?.x ?? 0,
    startY: origin?.y ?? 0,
    moved: false,
    captured,
  }
}

const startCanvasDrag = (event: PointerEvent) => {
  beginDrag('canvas', event)
}

const startNodeDrag = (nodeId: string, event: PointerEvent) => {
  beginDrag('node', event, nodeId)
}

const applyPendingDrag = () => {
  dragFrame = null
  if (!activeDrag || !pendingPointer) {
    return
  }
  const deltaX = pendingPointer.x - activeDrag.startClientX
  const deltaY = pendingPointer.y - activeDrag.startClientY
  if (!activeDrag.moved && Math.hypot(deltaX, deltaY) >= dragThreshold) {
    activeDrag.moved = true
    if (activeDrag.kind === 'node') {
      activeDrag.target.setPointerCapture(activeDrag.pointerId)
      activeDrag.captured = true
      draggingNodeId.value = activeDrag.nodeId ?? null
    }
  }
  const next = {
    x: activeDrag.startX + deltaX,
    y: activeDrag.startY + deltaY,
  }
  if (activeDrag.kind === 'node' && activeDrag.nodeId) {
    nodeOffsets.set(activeDrag.nodeId, next)
  } else {
    pan.x = next.x
    pan.y = next.y
  }
}

const continueDrag = (event: PointerEvent) => {
  if (event.pointerId !== activeDrag?.pointerId) {
    return
  }
  pendingPointer = { x: event.clientX, y: event.clientY }
  if (dragFrame === null) {
    dragFrame = window.requestAnimationFrame(applyPendingDrag)
  }
}

const stopDrag = (event: PointerEvent) => {
  if (event.pointerId !== activeDrag?.pointerId) {
    return
  }
  pendingPointer = { x: event.clientX, y: event.clientY }
  if (dragFrame !== null) {
    window.cancelAnimationFrame(dragFrame)
  }
  applyPendingDrag()

  const finishedDrag = activeDrag
  activeDrag = null
  pendingPointer = null
  draggingNodeId.value = null
  if (
    finishedDrag.captured
    && finishedDrag.target.hasPointerCapture(finishedDrag.pointerId)
  ) {
    finishedDrag.target.releasePointerCapture(finishedDrag.pointerId)
  }
  if (finishedDrag.kind === 'node' && finishedDrag.nodeId && finishedDrag.moved) {
    suppressedClickNodeId.value = finishedDrag.nodeId
    window.setTimeout(() => {
      if (suppressedClickNodeId.value === finishedDrag.nodeId) {
        suppressedClickNodeId.value = null
      }
    }, 0)
  }
}

const selectNode = (revisionId: string) => {
  if (suppressedClickNodeId.value === revisionId) {
    return
  }
  emit('select', revisionId)
}

watch(() => props.tree.note_id, async () => {
  initialTreeCentered = false
  await nextTick()
  resetView()
}, { immediate: true })

watch(measurementsReady, (ready) => {
  if (ready && !initialTreeCentered) {
    centerTree()
    initialTreeCentered = true
  }
})

watch(() => props.tree.nodes.map((node) => node.id), (nodeIds) => {
  const currentIds = new Set(nodeIds)
  for (const nodeId of nodeOffsets.keys()) {
    if (!currentIds.has(nodeId)) {
      nodeOffsets.delete(nodeId)
    }
  }
  for (const nodeId of nodeHeights.keys()) {
    if (!currentIds.has(nodeId)) {
      nodeHeights.delete(nodeId)
    }
  }
})

onMounted(() => {
  if (!viewportRef.value) {
    return
  }
  resizeObserver = new ResizeObserver(([entry]) => {
    if (!entry) {
      return
    }
    const wasEmpty = viewportWidth.value === 0
    viewportWidth.value = entry.contentRect.width
    if (wasEmpty) {
      centerTree()
    }
  })
  resizeObserver.observe(viewportRef.value)
  nodeResizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const nodeId = (entry.target as HTMLElement).dataset.nodeId
      if (nodeId && nodeElements.get(nodeId) === entry.target) {
        const height = entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height
        if (nodeHeights.get(nodeId) !== height) {
          nodeHeights.set(nodeId, height)
        }
      }
    }
  })
  for (const element of nodeElements.values()) {
    nodeResizeObserver.observe(element)
  }
})

onBeforeUnmount(() => {
  if (dragFrame !== null) {
    window.cancelAnimationFrame(dragFrame)
  }
  resizeObserver?.disconnect()
  nodeResizeObserver?.disconnect()
})
</script>

<style scoped>
.history-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  contain: layout paint;
}

.history-canvas:active {
  cursor: grabbing;
}

.history-world {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  will-change: transform;
}

.history-world.is-measuring {
  visibility: hidden;
}

.history-links {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

.history-link {
  fill: none;
  stroke: var(--color-line);
  stroke-width: var(--history-link-width);
  vector-effect: non-scaling-stroke;
  transition: stroke var(--motion-theme-duration) ease;
}

.history-node-position {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  cursor: grab;
}

.history-node-position.is-dragging {
  z-index: 2;
  cursor: grabbing;
  will-change: transform;
}
</style>
