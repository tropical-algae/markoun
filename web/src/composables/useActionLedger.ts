import { ref } from 'vue'

export const useActionLedger = () => {
  const pendingCounts = ref<Record<string, number>>({})

  const beginAction = (key: string) => {
    pendingCounts.value = {
      ...pendingCounts.value,
      [key]: (pendingCounts.value[key] || 0) + 1,
    }

    return () => {
      const nextCount = Math.max((pendingCounts.value[key] || 1) - 1, 0)
      if (nextCount === 0) {
        const { [key]: _, ...rest } = pendingCounts.value
        pendingCounts.value = rest
        return
      }

      pendingCounts.value = {
        ...pendingCounts.value,
        [key]: nextCount,
      }
    }
  }

  const runAction = async <T>(key: string, task: () => Promise<T>): Promise<T> => {
    const finishAction = beginAction(key)
    try {
      return await task()
    } finally {
      finishAction()
    }
  }

  const isActionPending = (key: string): boolean => {
    return Boolean(pendingCounts.value[key])
  }

  return {
    pendingCounts,
    runAction,
    isActionPending,
  }
}
