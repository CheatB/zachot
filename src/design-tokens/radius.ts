/**
 * Border radius design tokens
 * 8/12/16/20
 */

export const radius = {
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  lg: '1rem', // 16px
  xl: '1.25rem', // 20px
  full: '9999px',
} as const

export const radiusVars = {
  'radius-sm': radius.sm,
  'radius-md': radius.md,
  'radius-lg': radius.lg,
  'radius-xl': radius.xl,
  'radius-full': radius.full,
} as const


