import {
  computed,
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import type { AsyncStatus } from '@/types/async'
import { ASYNC_GATE_DELAY_MS, ASYNC_GATE_MIN_VISIBLE_MS } from '@/constants/ui'

export type AsyncGateDisplayState = 'loading' | 'content' | 'empty' | 'error'

export interface UseAsyncGateOptions {
  status: MaybeRefOrGetter<AsyncStatus>
  isEmpty?: MaybeRefOrGetter<boolean>
  showDelayMs?: MaybeRefOrGetter<number | undefined>
  minVisibleMs?: MaybeRefOrGetter<number | undefined>
  loadingOnRefreshing?: MaybeRefOrGetter<boolean | undefined>
}

export const DEFAULT_ASYNC_GATE_DELAY_MS = ASYNC_GATE_DELAY_MS
export const DEFAULT_ASYNC_GATE_MIN_VISIBLE_MS = ASYNC_GATE_MIN_VISIBLE_MS

export const useAsyncGate = (options: UseAsyncGateOptions) => {
  const isLoadingState = () => {
    const status = toValue(options.status)
    return status === 'idle' ||
      status === 'loading' ||
      (Boolean(toValue(options.loadingOnRefreshing) ?? true) && status === 'refreshing')
  }

  const displayState = ref<AsyncGateDisplayState>(
    isLoadingState() ? 'loading' : 'content'
  )
  let showTimer: number | null = null
  let hideTimer: number | null = null
  let loadingVisibleAt = 0

  const clearShowTimer = () => {
    if (showTimer !== null) {
      window.clearTimeout(showTimer)
      showTimer = null
    }
  }

  const clearHideTimer = () => {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  const resolveSettledState = (): AsyncGateDisplayState => {
    const status = toValue(options.status)
    if (status === 'error') {
      return 'error'
    }

    if (Boolean(toValue(options.isEmpty))) {
      return 'empty'
    }

    return 'content'
  }

  const showLoading = () => {
    displayState.value = 'loading'
    loadingVisibleAt = Date.now()
  }

  const syncDisplayState = () => {
    const showDelayMs = Number(
      toValue(options.showDelayMs) ?? DEFAULT_ASYNC_GATE_DELAY_MS
    )
    const minVisibleMs = Number(
      toValue(options.minVisibleMs) ?? DEFAULT_ASYNC_GATE_MIN_VISIBLE_MS
    )

    if (isLoadingState()) {
      clearHideTimer()

      if (displayState.value === 'loading') {
        return
      }

      clearShowTimer()
      if (showDelayMs <= 0) {
        showLoading()
        return
      }

      showTimer = window.setTimeout(() => {
        showTimer = null
        if (isLoadingState()) {
          showLoading()
        }
      }, showDelayMs)
      return
    }

    clearShowTimer()

    const nextState = resolveSettledState()
    if (displayState.value !== 'loading') {
      displayState.value = nextState
      return
    }

    const elapsed = Date.now() - loadingVisibleAt
    const remaining = Math.max(0, minVisibleMs - elapsed)

    clearHideTimer()
    if (remaining === 0) {
      displayState.value = nextState
      return
    }

    hideTimer = window.setTimeout(() => {
      hideTimer = null
      if (!isLoadingState()) {
        displayState.value = resolveSettledState()
      }
    }, remaining)
  }

  if (displayState.value === 'loading') {
    loadingVisibleAt = Date.now()
  } else {
    displayState.value = resolveSettledState()
  }

  watch(
    [
      () => toValue(options.status),
      () => Boolean(toValue(options.isEmpty)),
      () => Number(
        toValue(options.showDelayMs) ?? DEFAULT_ASYNC_GATE_DELAY_MS,
      ),
      () => Number(
        toValue(options.minVisibleMs) ?? DEFAULT_ASYNC_GATE_MIN_VISIBLE_MS,
      ),
      () => Boolean(toValue(options.loadingOnRefreshing) ?? true),
    ],
    syncDisplayState,
    { immediate: true },
  )

  onBeforeUnmount(() => {
    clearShowTimer()
    clearHideTimer()
  })

  return {
    displayState,
    showLoading: computed(() => displayState.value === 'loading'),
    showContent: computed(() => displayState.value === 'content'),
    showEmpty: computed(() => displayState.value === 'empty'),
    showError: computed(() => displayState.value === 'error'),
  }
}
