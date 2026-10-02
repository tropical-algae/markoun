import assert from 'node:assert/strict'
import test from 'node:test'
import {
  planFileTreeMotion,
  type TreeRowLayout,
  type TreeMotionTiming,
} from '../src/utils/file-tree-motion.ts'

const timing: TreeMotionTiming = {
  duration: 540, minDuration: 480, maxDuration: 1920,
  referenceDistance: 80,
}
const ease = (progress: number) => 1 - (1 - progress) ** 4
const layout = (paths: string[]) => new Map(paths.map((path, index) => [path, {
  path, top: index * 26, visualTop: index * 26, height: 26,
}]))
const collapsed = layout(['A', 'A/B', 'A/B/C', 'A/B/after', 'A/after', 'after'])
const expanded = layout([
  'A', 'A/B', 'A/B/C', 'A/B/C/D', 'A/B/C/D/note', 'A/B/C/note',
  'A/B/after', 'A/after', 'after',
])
const plan = (before: Map<string, TreeRowLayout>, after: Map<string, TreeRowLayout>) => (
  planFileTreeMotion(before, after, new Set(['A/B/C']), timing, 1, ease)
)

test('ancestor groups follow the moving child instead of starting on a fixed delay', () => {
  const result = plan(collapsed, expanded)!
  assert.deepEqual(result.rows.map((row) => row.path), ['A/B/after', 'A/after', 'after'])
  assert.deepEqual(result.rows.map((row) => row.level), [0, 1, 2])
  for (const row of result.rows) {
    assert.equal(row.offset, -78)
  }
  const positions = result.curves.map((curve) => curve.ease(120 / curve.duration))
  assert.ok(positions[0]! > positions[1]! && positions[1]! > positions[2]!)
  assert.ok(positions[2]! > 0)
  assert.ok(result.curves[2]!.duration > result.curves[1]!.duration)
  assert.ok(result.curves[1]!.duration > result.curves[0]!.duration)
  assert.equal(result.curves[0]!.duration, timing.duration * Math.sqrt(78 / timing.referenceDistance))
})

test('opening and closing the same settled branch use symmetric timing', () => {
  const open = plan(collapsed, expanded)!
  const close = plan(expanded, collapsed)!
  assert.equal(open.duration, close.duration)
  assert.deepEqual(close.rows, open.rows.map((row) => ({ ...row, offset: -row.offset })))
})

test('a display update without a layout change does not interrupt an active motion', () => {
  const moving = new Map([...expanded].map(([path, row]) => [path, {
    ...row, visualTop: row.top - 10,
  }]))
  assert.equal(plan(moving, moving), null)
})

test('an interrupted transition resumes from the visual position, not its old destination', () => {
  const moving = new Map([...expanded].map(([path, row]) => [path, {
    ...row, visualTop: row.top - 30,
  }]))
  const result = plan(moving, collapsed)!
  const row = result.rows.find((row) => row.path === 'after')!
  assert.equal(row.offset, 48)
})

test('the skeleton-to-content transition uses the skeleton layout as its starting point', () => {
  const skeleton = new Map([...collapsed].map(([path, row]) => [path, {
    ...row,
    top: row.top + (row.top > 52 ? 26 : 0),
    visualTop: row.visualTop + (row.top > 52 ? 26 : 0),
  }]))
  assert.equal(plan(skeleton, expanded)!.rows.find((row) => row.path === 'after')!.offset, -52)
})

test('reordering animates even when total tree height has not changed', () => {
  const before = layout(['a', 'b', 'c'])
  const after = layout(['c', 'a', 'b'])
  const result = planFileTreeMotion(before, after, new Set(['.']), timing, 1, ease)!
  assert.equal(result.rows.length, 3)
  assert.ok(result.rows.every((row) => row.level === 0))
})

test('removing the final child produces the natural empty layout', () => {
  const before = layout(['folder', 'folder/note', 'after'])
  const after = layout(['folder', 'after'])
  const result = planFileTreeMotion(before, after, new Set(['folder']), timing, 1, ease)!
  assert.deepEqual(result.rows.map((row) => [row.path, row.offset]), [['after', 26]])
})

test('deep nesting settles within the sum of the configured resize durations', () => {
  const ancestors = Array.from({ length: 20 }, (_, index) => Array(index + 1).fill('d').join('/'))
  const tail = ancestors.slice().reverse().map((path) => `${path}/after`)
  const source = ancestors.at(-1)!
  const before = layout([...ancestors, ...tail, 'after'])
  const after = layout([...ancestors, `${source}/note`, ...tail, 'after'])
  const result = planFileTreeMotion(before, after, new Set([source]), timing, 1, ease)!
  assert.ok(result.duration <= timing.duration + ancestors.length * timing.maxDuration)
  assert.ok(result.curves.every((curve) => curve.duration > 0 && curve.ease(1) === 1))
})

test('a following subtree shares its group regardless of its own depth', () => {
  const before = layout(['A', 'A/B', 'A/B/C', 'A/Other', 'A/Other/Deep', 'A/Other/Deep/note'])
  const after = layout(['A', 'A/B', 'A/B/C', 'A/B/C/note', 'A/Other', 'A/Other/Deep', 'A/Other/Deep/note'])
  const result = plan(before, after)!
  assert.equal(new Set(result.rows.map((row) => row.level)).size, 1)
})

test('curves are monotonic, scale-independent, and do not require per-frame integration', () => {
  const result = plan(collapsed, expanded)!
  for (const curve of result.curves) {
    let previous = 0
    for (let sample = 0; sample <= 240; sample += 1) {
      const value = curve.ease(sample / 240)
      assert.ok(value >= previous && value <= 1)
      previous = value
    }
    // Sampling at a different display frequency does not change the trajectory.
    assert.equal(curve.ease(30 / 60), curve.ease(60 / 120))
    assert.equal(curve.ease(0), 0)
    assert.equal(curve.ease(1), 1)
  }
})

test('opening and closing scale with displacement and respect the configured bounds', () => {
  const before = layout(['folder', 'after'])
  const durations = [1, 4, 10, 100].map((count) => {
    const after = layout(['folder', ...Array.from({ length: count }, (_, i) => `folder/${i}`), 'after'])
    const open = planFileTreeMotion(before, after, new Set(['folder']), timing, 1, ease)!
    const close = planFileTreeMotion(after, before, new Set(['folder']), timing, 1, ease)!
    assert.equal(open.curves[0]!.duration, close.curves[0]!.duration)
    return open.curves[0]!.duration
  })
  assert.equal(durations[0], timing.minDuration)
  assert.equal(durations[3], timing.maxDuration)
  assert.ok(durations[0]! < durations[1]! && durations[1]! < durations[2]! && durations[2]! < durations[3]!)
})

test('skeleton replacement and cached opening use the same timing for the same displacement', () => {
  const before = layout(['folder', 'after'])
  const after = layout(['folder', ...Array.from({ length: 4 }, (_, i) => `folder/${i}`), 'after'])
  const skeleton = new Map([...before].map(([path, row]) => [path, {
    ...row, top: row.top + (path === 'after' ? 26 : 0), visualTop: row.visualTop + (path === 'after' ? 26 : 0),
  }]))
  const content = layout(['folder', ...Array.from({ length: 5 }, (_, i) => `folder/${i}`), 'after'])
  const open = planFileTreeMotion(before, after, new Set(['folder']), timing, 1, ease)!
  const loaded = planFileTreeMotion(skeleton, content, new Set(['folder']), timing, 1, ease)!
  assert.equal(open.curves[0]!.duration, loaded.curves[0]!.duration)
  assert.equal(open.curves[0]!.duration, timing.duration * Math.sqrt(104 / timing.referenceDistance))
})

test('interrupted motion duration uses the remaining visual displacement', () => {
  const before = layout(['folder', 'after'])
  const after = layout(['folder', ...Array.from({ length: 10 }, (_, i) => `folder/${i}`), 'after'])
  const moving = new Map([...after].map(([path, row]) => [path, {
    ...row, visualTop: row.visualTop - (path === 'after' ? 180 : 0),
  }]))
  const full = planFileTreeMotion(after, before, new Set(['folder']), timing, 1, ease)!
  const interrupted = planFileTreeMotion(moving, before, new Set(['folder']), timing, 1, ease, -260)!
  assert.equal(interrupted.rows[0]!.offset, 80)
  assert.equal(interrupted.curves[0]!.duration, timing.duration)
  assert.ok(interrupted.curves[0]!.duration < full.curves[0]!.duration)
})

test('a terminal branch entrance uses extent change when there are no following rows', () => {
  const before = layout(['folder'])
  const after = layout(['folder', ...Array.from({ length: 10 }, (_, i) => `folder/${i}`)])
  const terminal = planFileTreeMotion(before, after, new Set(['folder']), timing, 1, ease, 260)!
  const withFollower = planFileTreeMotion(
    layout(['folder', 'after']),
    layout([...after.keys(), 'after']),
    new Set(['folder']), timing, 1, ease, 260,
  )!
  assert.equal(terminal.rows.length, 0)
  assert.equal(terminal.curves[0]!.duration, withFollower.curves[0]!.duration)
  assert.ok(terminal.curves[0]!.duration > timing.duration)
})

test('a terminal skeleton replacement uses the remaining extent rather than full content size', () => {
  const skeleton = layout(['folder'])
  const content = layout(['folder', ...Array.from({ length: 10 }, (_, i) => `folder/${i}`)])
  const loaded = planFileTreeMotion(skeleton, content, new Set(['folder']), timing, 1, ease, 234)!
  assert.equal(loaded.curves[0]!.duration, timing.duration * Math.sqrt(234 / timing.referenceDistance))
})

test('an extent-only change is measured even without file rows', () => {
  const empty = layout([])
  const result = planFileTreeMotion(empty, empty, new Set(['.']), timing, 1, ease, 104)!
  assert.equal(result.curves[0]!.duration, timing.duration * Math.sqrt(104 / timing.referenceDistance))
})
