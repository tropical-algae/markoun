import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

export const usePagination = <T>(
  items: MaybeRefOrGetter<readonly T[]>,
  pageSize: number,
) => {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError('Page size must be a positive integer')
  }

  const requestedPage = ref(1)
  const total = computed(() => toValue(items).length)
  const pageCount = computed(() => Math.ceil(total.value / pageSize))
  const page = computed(() => Math.min(requestedPage.value, Math.max(1, pageCount.value)))
  const offset = computed(() => (page.value - 1) * pageSize)
  const pageItems = computed(() => toValue(items).slice(offset.value, offset.value + pageSize))
  const firstItem = computed(() => total.value ? offset.value + 1 : 0)
  const lastItem = computed(() => Math.min(offset.value + pageSize, total.value))

  const setPage = (value: number) => {
    if (Number.isInteger(value)) {
      requestedPage.value = Math.max(1, Math.min(value, Math.max(1, pageCount.value)))
    }
  }

  // A replaced collection is a new result set, not a continuation of the old page.
  watch(() => toValue(items), () => { requestedPage.value = 1 }, { flush: 'sync' })

  return { page, pageCount, pageItems, total, firstItem, lastItem, setPage }
}
