export const ASYNC_GATE_DELAY_MS = 150
export const ASYNC_GATE_MIN_VISIBLE_MS = 400
export const EDITOR_ASYNC_GATE_DELAY_MS = 0

export const SIDEBAR_PANE_WIDTH = {
  initial: 250,
  min: 240,
  max: 500,
} as const

export const INSPECTOR_PANE_WIDTH = {
  initial: 250,
  min: 200,
  max: 600,
} as const

export const IMAGE_PREVIEW_SIZE = {
  defaultWidth: 640,
  defaultHeight: 420,
  minWidth: 280,
  maxWidth: 720,
  minStageWidth: 220,
  minStageHeight: 180,
  viewportWidthRatio: 0.82,
  viewportHeightRatio: 0.72,
} as const

export const TOAST_MOTION = {
  lifeMs: 5000,
  enterY: 20,
  leaveY: -20,
  enterDuration: 0.4,
  leaveDuration: 0.25,
} as const

export const TREE_LONG_PRESS_DELAY_MS = 600
export const USER_PROFILE_HEIGHT_MOTION_DURATION = 0.35
