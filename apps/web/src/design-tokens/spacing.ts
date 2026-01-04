/**
 * Spacing design tokens
 * 2/4/8/12/16/20/24/32/40/48/64
 */

export const spacing = {
  2: '0.125rem', // 2px
  4: '0.25rem', // 4px
  8: '0.5rem', // 8px
  12: '0.75rem', // 12px
  16: '1rem', // 16px
  20: '1.25rem', // 20px
  24: '1.5rem', // 24px
  32: '2rem', // 32px
  40: '2.5rem', // 40px
  48: '3rem', // 48px
  64: '4rem', // 64px
} as const

// Semantic spacing names
export const spacingSemantic = {
  xs: spacing[4],
  sm: spacing[8],
  md: spacing[16],
  lg: spacing[24],
  xl: spacing[32],
  '2xl': spacing[48],
  '3xl': spacing[64],
} as const

export const spacingVars = {
  'spacing-2': spacing[2],
  'spacing-4': spacing[4],
  'spacing-8': spacing[8],
  'spacing-12': spacing[12],
  'spacing-16': spacing[16],
  'spacing-20': spacing[20],
  'spacing-24': spacing[24],
  'spacing-32': spacing[32],
  'spacing-40': spacing[40],
  'spacing-48': spacing[48],
  'spacing-64': spacing[64],
  'spacing-xs': spacingSemantic.xs,
  'spacing-sm': spacingSemantic.sm,
  'spacing-md': spacingSemantic.md,
  'spacing-lg': spacingSemantic.lg,
  'spacing-xl': spacingSemantic.xl,
  'spacing-2xl': spacingSemantic['2xl'],
  'spacing-3xl': spacingSemantic['3xl'],
} as const


