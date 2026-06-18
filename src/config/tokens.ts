// Design tokens — colors, typography, spacing
// Source of truth for all visual constants in MIKI

export const Colors = {
  // Neutral bases
  studioBackdrop: '#0b132b',
  menuPanel: '#1c2541',
  textSheet: '#ffffff',

  // Primary accent
  accent: '#6366f1',

  // Semantic diagnostics
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',

  // Translucent overlays
  overlayDark: 'rgba(11, 19, 43, 0.85)',
} as const

export const Typography = {
  // Font sizes
  h1: '32px',
  body: '18px',
  micro: '14px',

  // Font weights
  bold: '700',
  regular: '400',

  // Line heights
  headingLineHeight: '1.2',
  bodyLineHeight: '1.7',
} as const

export const Spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '40px',
  xxl: '64px',
} as const

export const Panel = {
  leftWidth: '260px',
  rightWidth: '300px',
  toolbarHeight: '52px',
} as const
