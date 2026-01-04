/**
 * Typography design tokens
 * System font stack with fallbacks
 */

export const typography = {
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(', '),
    mono: [
      '"SF Mono"',
      'Monaco',
      '"Cascadia Code"',
      '"Roboto Mono"',
      'Consolas',
      '"Courier New"',
      'monospace',
    ].join(', '),
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const

export const typographyVars = {
  'font-family-sans': typography.fontFamily.sans,
  'font-family-mono': typography.fontFamily.mono,
  'font-size-xs': typography.fontSize.xs,
  'font-size-sm': typography.fontSize.sm,
  'font-size-base': typography.fontSize.base,
  'font-size-lg': typography.fontSize.lg,
  'font-size-xl': typography.fontSize.xl,
  'font-size-2xl': typography.fontSize['2xl'],
  'font-size-3xl': typography.fontSize['3xl'],
  'font-size-4xl': typography.fontSize['4xl'],
  'font-size-5xl': typography.fontSize['5xl'],
  'line-height-tight': typography.lineHeight.tight.toString(),
  'line-height-normal': typography.lineHeight.normal.toString(),
  'line-height-relaxed': typography.lineHeight.relaxed.toString(),
  'line-height-loose': typography.lineHeight.loose.toString(),
  'font-weight-normal': typography.fontWeight.normal.toString(),
  'font-weight-medium': typography.fontWeight.medium.toString(),
  'font-weight-semibold': typography.fontWeight.semibold.toString(),
  'font-weight-bold': typography.fontWeight.bold.toString(),
} as const


