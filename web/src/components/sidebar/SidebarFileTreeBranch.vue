<template>
  <Transition name="tree-branch">
    <div v-if="isVisible" class="tree-branch">
      <SidebarFileTreeStateGate :status="asyncStatus" :path="path">
        <template #loading>
          <SidebarFileTreeSkeleton :depth="depth" />
        </template>

        <template #error>
          <button
            type="button"
            class="tree-branch-error f-xs"
            :style="branchIndentStyle"
            @click="emit('retry')"
          >
            Unable to load. Retry
          </button>
        </template>

        <div class="tree-branch-list" :data-tree-drop-path="path">
          <SidebarFileTreeItem
            v-for="child in nodes"
            :key="child.path"
            :node="child"
            :depth="depth"
            @node-opened="emit('nodeOpened')"
          />
        </div>
      </SidebarFileTreeStateGate>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import SidebarFileTreeItem from '@/components/sidebar/SidebarFileTreeItem.vue'
import SidebarFileTreeSkeleton from '@/components/sidebar/SidebarFileTreeSkeleton.vue'
import SidebarFileTreeStateGate from '@/components/sidebar/SidebarFileTreeStateGate.vue'
import { useFileTreeMotion } from '@/composables/useFileTreeMotion'
import type { AsyncStatus } from '@/types/async'
import type { DirectoryRenderState, FsNode } from '@/types/file-system'

const props = defineProps<{
  path: string
  depth: number
  state: DirectoryRenderState
  nodes: FsNode[]
}>()

const emit = defineEmits<{
  (event: 'retry'): void
  (event: 'nodeOpened'): void
}>()

const motion = useFileTreeMotion()
const isVisible = computed(() => ['loading', 'error', 'content'].includes(props.state))
watch([isVisible, () => props.nodes], ([visible, children], [previousVisible, previousChildren]) => {
  if (
    visible !== previousVisible
    || children.length !== previousChildren.length
    || children.some((child, index) => child.path !== previousChildren[index]?.path)
  ) {
    motion.beforeLayoutChange(props.path)
  }
})

const asyncStatus = computed<AsyncStatus>(() => {
  if (props.state === 'error') {
    return 'error'
  }
  return props.state === 'loading' ? 'loading' : 'ready'
})
const branchIndentStyle = computed(() => ({ '--tree-depth': props.depth }))
</script>

<style scoped>
.tree-branch {
  width: 100%;
  min-width: 0;
}

.tree-branch-list {
  width: 100%;
  min-width: 0;
}

.tree-branch-error {
  width: 100%;
  min-width: 0;
  min-height: var(--tree-node-row-height);
  padding: var(--tree-row-padding);
  padding-left: calc(
    var(--tree-depth) * var(--tree-indent-step) +
    var(--tree-row-padding-x)
  );
  border: 0;
  color: var(--color-text-sec);
  background: transparent;
  cursor: pointer;
}

.tree-branch-enter-active {
  transition: opacity var(--motion-tree-enter-duration) var(--motion-tree-easing);
}

.tree-branch-leave-active {
  position: absolute;
  top: 100%;
  inset-inline: 0;
  pointer-events: none;
  transition: opacity var(--motion-soft-duration) ease;
}

.tree-branch-enter-from {
  opacity: 0;
}

.tree-branch-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .tree-branch-enter-active,
  .tree-branch-leave-active {
    transition: none;
  }
}
</style>
