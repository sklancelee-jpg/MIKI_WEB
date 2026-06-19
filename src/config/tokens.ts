/**
 * tokens.ts — JS re-exports of the CSS design tokens defined in global.css.
 *
 * global.css is the single source of truth for all visual constants (see :root).
 * Use CSS custom properties (var(--...)) in stylesheets and inline styles.
 * Use these JS constants only when a value must be computed in TypeScript
 * (e.g. canvas drawing, dynamic color derivation).
 *
 * To add a token: add it to global.css :root first, then mirror it here.
 */

// ── Colors ──────────────────────────────────────────────────────────────────
export const Colors = {
  canvas:       'var(--color-canvas)',
  backdrop:     'var(--color-backdrop)',
  panel:        'var(--color-panel)',
  panelSolid:   'var(--color-panel-solid)',
  text:         'var(--color-text)',
  textMuted:    'var(--color-text-muted)',
  accent:       'var(--color-accent)',
  accentHover:  'var(--color-accent-hover)',
  border:       'var(--color-border)',
  overlay:      'var(--color-overlay)',
} as const

// ── Typography ───────────────────────────────────────────────────────────────
export const Typography = {
  h1:    'var(--font-size-h1)',
  body:  'var(--font-size-body)',
  micro: 'var(--font-size-micro)',
  nano:  'var(--font-size-nano)',
} as const

// ── Spacing ──────────────────────────────────────────────────────────────────
export const Spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '16px',
  lg:  '24px',
  xl:  '40px',
  xxl: '64px',
} as const

// ── Layout ───────────────────────────────────────────────────────────────────
export const Panel = {
  leftWidth:     'var(--panel-left)',
  rightWidth:    'var(--panel-right)',
  toolbarHeight: 'var(--toolbar-height)',
} as const

// ── Radii ────────────────────────────────────────────────────────────────────
export const Radius = {
  xs: 'var(--radius-xs)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
} as const
