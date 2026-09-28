<template>
  <Transition name="tree-branch">
    <div v-if="isVisible" class="tree-branch">
      <div :ref="heightMotion.setShellRef" class="tree-branch-shell">
        <div :ref="heightMotion.setContentRef" class="tree-branch-content">
          <SidebarFileTreeStateGate
            :status="asyncStatus"
          >
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

            <LayoutGroup :id="layoutGroupId">
              <div class="tree-branch-list" :data-tree-drop-path="path">
                <slot />
              </div>
            </LayoutGroup>
          </SidebarFileTreeStateGate>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LayoutGroup } from 'motion-v'
import { useAutoHeightMotion } from '@/composables/useAutoHeightMotion'
import SidebarFileTreeSkeleton from '@/components/sidebar/SidebarFileTreeSkeleton.vue'
import SidebarFileTreeStateGate from '@/components/sidebar/SidebarFileTreeStateGate.vue'
import type { AsyncStatus } from '@/types/async'
import type { DirectoryRenderState } from '@/types/file-system'

const props = defineProps<{
  path: string
  depth: number
  state: DirectoryRenderState
}>()

const emit = defineEmits<{
  (event: 'retry'): void
}>()

const heightMotion = useAutoHeightMotion()
const isVisible = computed(() => ['loading', 'error', 'content'].includes(props.state))
const asyncStatus = computed<AsyncStatus>(() => {
  if (props.state === 'error') {
    return 'error'
  }
  return props.state === 'loading' ? 'loading' : 'ready'
})
const layoutGroupId = computed(() => `file-tree:${props.path}`)
const branchIndentStyle = computed(() => ({ '--tree-depth': props.depth }))
</script>

<style scoped>
.tree-branch {
  display: grid;
  grid-template-rows: 1fr;
  width: 100%;
  min-width: 0;
}

.tree-branch-shell {
  min-height: 0;
  min-width: 0;
  overflow: visible;
}

.tree-branch-content {
  position: relative;
  min-width: 0;
  isolation: isolate;
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
  transition: grid-template-rows
    var(--motion-tree-duration)
    var(--motion-tree-easing);
}

.tree-branch-leave-active {
  transition:
    grid-template-rows var(--motion-tree-duration) var(--motion-tree-easing),
    opacity var(--motion-soft-duration) ease;
}

.tree-branch-enter-from {
  grid-template-rows: 0fr;
}

.tree-branch-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .tree-branch-enter-active,
  .tree-branch-leave-active {
    transition: none;
  }
}
</style>
