import assert from 'node:assert/strict'
import test from 'node:test'
import { effectScope, shallowRef } from 'vue'
import { usePagination } from '../src/composables/usePagination.ts'

test('only the current page is exposed, including a partial final page', () => {
  const scope = effectScope()
  try {
    scope.run(() => {
      const items = shallowRef(Array.from({ length: 25 }, (_, index) => ({ index })))
      const pagination = usePagination(items, 10)
      assert.equal(pagination.total.value, 25)
      assert.equal(pagination.pageCount.value, 3)
      assert.equal(pagination.firstItem.value, 1)
      assert.equal(pagination.lastItem.value, 10)
      assert.equal(pagination.pageItems.value.length, 10)
      assert.equal(pagination.pageItems.value[0], items.value[0])

      pagination.setPage(2)
      assert.deepEqual(pagination.pageItems.value, items.value.slice(10, 20))
      pagination.setPage(3)
      assert.equal(pagination.firstItem.value, 21)
      assert.equal(pagination.lastItem.value, 25)
      assert.equal(pagination.pageItems.value.length, 5)
    })
  } finally { scope.stop() }
})

test('empty results and invalid page requests stay within bounds', () => {
  const scope = effectScope()
  try {
    scope.run(() => {
      const items = shallowRef<number[]>([])
      const pagination = usePagination(items, 10)
      assert.equal(pagination.pageCount.value, 0)
      assert.equal(pagination.firstItem.value, 0)
      assert.equal(pagination.lastItem.value, 0)
      assert.deepEqual(pagination.pageItems.value, [])
      pagination.setPage(99)
      assert.equal(pagination.page.value, 1)

      items.value = Array.from({ length: 12 }, (_, i) => i)
      pagination.setPage(99)
      assert.equal(pagination.page.value, 2)
      for (const invalid of [NaN, Infinity, 1.5]) {
        pagination.setPage(invalid)
        assert.equal(pagination.page.value, 2)
      }
      pagination.setPage(-2)
      assert.equal(pagination.page.value, 1)
    })
  } finally { scope.stop() }
})

test('replacing search results resets the page synchronously, even with the same size', () => {
  const scope = effectScope()
  try {
    scope.run(() => {
      const items = shallowRef(Array.from({ length: 25 }, (_, i) => i))
      const pagination = usePagination(items, 10)
      pagination.setPage(3)
      items.value = Array.from({ length: 25 }, (_, i) => i + 100)
      assert.equal(pagination.page.value, 1)
      assert.equal(pagination.pageItems.value[0], 100)

      items.value = []
      assert.equal(pagination.page.value, 1)
      assert.equal(pagination.lastItem.value, 0)
    })
  } finally { scope.stop() }
})

test('pagination does not mutate or deep-proxy the result snapshot', () => {
  const scope = effectScope()
  try {
    scope.run(() => {
      const snapshot = Object.freeze(Array.from({ length: 15 }, (_, index) => Object.freeze({ index })))
      const pagination = usePagination(() => snapshot, 10)
      pagination.setPage(2)
      assert.equal(pagination.pageItems.value[0], snapshot[10])
      assert.equal(snapshot.length, 15)
    })
  } finally { scope.stop() }
})

test('invalid page sizes are rejected', () => {
  for (const size of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => usePagination([], size), RangeError)
  }
})
