export interface TreeRowLayout {
  path: string
  top: number
  visualTop: number
  height: number
}

export interface TreeMotionTiming {
  duration: number
  minDuration: number
  maxDuration: number
  referenceDistance: number
}

export interface TreeRowMotion {
  path: string
  offset: number
  level: number
}

export interface TreeMotionCurve {
  duration: number
  ease: (progress: number) => number
}

// Numerical resolution, not playback FPS. GSAP interpolates the sampled curve
// at the display's refresh rate; no simulation or DOM measurement runs per frame.
const CURVE_SAMPLES_PER_DURATION = 128

const resolveMotionDuration = (distance: number, timing: TreeMotionTiming) => {
  const minimum = Math.max(0, Math.min(timing.minDuration, timing.maxDuration))
  const maximum = Math.max(minimum, timing.minDuration, timing.maxDuration)
  return Math.min(maximum, Math.max(
    minimum,
    timing.duration * Math.sqrt(Math.abs(distance) / timing.referenceDistance),
  ))
}

const followCurve = (
  parent: TreeMotionCurve,
  distance: number,
  timing: TreeMotionTiming,
  ease: TreeMotionCurve['ease'],
  pixelSize: number,
  step: number,
): TreeMotionCurve => {
  const samples = [0]
  let value = 0
  let from = 0
  let target = 0
  let startedAt = 0
  let duration = 0
  const end = parent.duration + Math.max(timing.minDuration, timing.maxDuration)

  // Reproduce a parent's resize retargeting against the child's moving boundary,
  // but entirely in numbers. Once the child settles, the parent finishes its tween.
  for (let index = 1; index <= Math.ceil(end / step) + 1; index += 1) {
    const time = index * step
    const progress = duration ? Math.min(1, (time - startedAt) / duration) : 1
    value = from + (target - from) * ease(progress)
    const nextTarget = parent.ease(Math.min(1, (time - step) / parent.duration))
    if (nextTarget !== target) {
      from = value
      target = nextTarget
      startedAt = time
      duration = resolveMotionDuration((target - value) * distance, timing)
    }
    samples.push(value)
    if (target === 1 && (1 - value) * distance <= pixelSize) {
      break
    }
  }

  samples[samples.length - 1] = 1
  const lastIndex = samples.length - 1
  return {
    duration: lastIndex * step,
    ease: (progress) => {
      const position = Math.max(0, Math.min(1, progress)) * lastIndex
      const index = Math.floor(position)
      const left = samples[index]!
      return left + ((samples[index + 1] ?? left) - left) * (position - index)
    },
  }
}

// Count ancestor boundaries crossed, not the destination row's nesting depth.
const propagationLevel = (source: string[], target: string[]) => {
  let common = 0
  while (common < source.length && source[common] === target[common]) {
    common += 1
  }
  return Math.max(0, source.length - common - 1)
}

export const planFileTreeMotion = (
  before: ReadonlyMap<string, TreeRowLayout>,
  after: ReadonlyMap<string, TreeRowLayout>,
  changedDirectories: ReadonlySet<string>,
  timing: TreeMotionTiming,
  pixelSize: number,
  ease: TreeMotionCurve['ease'],
  extentChange = 0,
): { duration: number; rows: TreeRowMotion[]; curves: TreeMotionCurve[] } | null => {
  const changed = Math.abs(extentChange) >= pixelSize || before.size !== after.size || [...after.values()].some((row) => {
    const previous = before.get(row.path)
    return !previous || Math.abs(row.top - previous.top) >= pixelSize
      || Math.abs(row.height - previous.height) >= pixelSize
  })
  if (!changed) {
    return null
  }

  const sources = [...changedDirectories].map((path) => ({
    parts: path === '.' ? [] : path.split('/'),
    top: before.get(path)?.top ?? after.get(path)?.top ?? -Infinity,
  }))
  const rows: TreeRowMotion[] = []
  let distance = 0
  let maxLevel = 0

  for (const row of after.values()) {
    const previous = before.get(row.path)
    if (!previous) {
      continue
    }
    const offset = previous.visualTop - row.top
    if (Math.abs(offset) < pixelSize) {
      continue
    }
    const parts = row.path.split('/')
    const levels = sources
      .filter((source) => source.top <= Math.max(previous.top, row.top))
      .map((source) => propagationLevel(source.parts, parts))
    const level = levels.length ? Math.min(...levels) : 0
    rows.push({ path: row.path, offset, level })
    distance = Math.max(distance, Math.abs(offset))
    maxLevel = Math.max(maxLevel, level)
  }

  // A last branch can grow without moving any existing row. Its entrance still
  // uses the actual layout change; active rows keep their visual displacement.
  distance = distance || Math.abs(extentChange)
  const duration = resolveMotionDuration(distance, timing)
  const curves: TreeMotionCurve[] = [{ duration, ease }]
  if (duration > 0) {
    const step = Math.min(duration, timing.minDuration || duration) / CURVE_SAMPLES_PER_DURATION
    for (let level = 1; level <= maxLevel; level += 1) {
      curves.push(followCurve(curves[level - 1]!, distance, timing, ease, pixelSize, step))
    }
  }

  return {
    duration: curves[curves.length - 1]!.duration,
    rows,
    curves,
  }
}
