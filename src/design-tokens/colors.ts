/**
 * Color design tokens
 * Premium neutral palette with electric blue accent
 * Ready for dark mode (structure prepared, but not enabled)
 */

export const colors = {
  // Neutral palette
  neutral: {
    0: '#ffffff',
    10: '#fafafa',
    20: '#f5f5f5',
    30: '#ebebeb',
    40: '#e0e0e0',
    50: '#d0d0d0',
    60: '#b0b0b0',
    70: '#909090',
    80: '#707070',
    90: '#505050',
    100: '#303030',
    110: '#202020',
    120: '#101010',
    130: '#000000',
  },

  // Accent: Green (Primary brand color - matches tokens.css)
  accent: {
    light: '#f0fdf4',
    base: '#16a34a',  // Green 600 (CTA color)
    dark: '#15803d',  // Green 700
    darker: '#166534', // Green 800
  },

  // Status colors
  success: {
    light: '#e8f5e9',
    base: '#4caf50',
    dark: '#388e3c',
  },
  warn: {
    light: '#fff3e0',
    base: '#ff9800',
    dark: '#f57c00',
  },
  danger: {
    light: '#ffebee',
    base: '#f44336',
    dark: '#d32f2f',
  },

  // Semantic colors
  surface: {
    base: '#ffffff',
    elevated: '#fafafa',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  border: {
    light: '#ebebeb',
    base: '#e0e0e0',
    dark: '#d0d0d0',
  },
  text: {
    primary: '#101010',
    secondary: '#505050',
    muted: '#707070',
    inverse: '#ffffff',
    disabled: '#b0b0b0',
  },
} as const

// CSS variable names (for runtime)
export const colorVars = {
  // Neutral
  'neutral-0': colors.neutral[0],
  'neutral-10': colors.neutral[10],
  'neutral-20': colors.neutral[20],
  'neutral-30': colors.neutral[30],
  'neutral-40': colors.neutral[40],
  'neutral-50': colors.neutral[50],
  'neutral-60': colors.neutral[60],
  'neutral-70': colors.neutral[70],
  'neutral-80': colors.neutral[80],
  'neutral-90': colors.neutral[90],
  'neutral-100': colors.neutral[100],
  'neutral-110': colors.neutral[110],
  'neutral-120': colors.neutral[120],
  'neutral-130': colors.neutral[130],

  // Accent
  'accent-light': colors.accent.light,
  'accent-base': colors.accent.base,
  'accent-dark': colors.accent.dark,
  'accent-darker': colors.accent.darker,

  // Status
  'success-light': colors.success.light,
  'success-base': colors.success.base,
  'success-dark': colors.success.dark,
  'warn-light': colors.warn.light,
  'warn-base': colors.warn.base,
  'warn-dark': colors.warn.dark,
  'danger-light': colors.danger.light,
  'danger-base': colors.danger.base,
  'danger-dark': colors.danger.dark,

  // Semantic
  'surface-base': colors.surface.base,
  'surface-elevated': colors.surface.elevated,
  'surface-overlay': colors.surface.overlay,
  'border-light': colors.border.light,
  'border-base': colors.border.base,
  'border-dark': colors.border.dark,
  'text-primary': colors.text.primary,
  'text-secondary': colors.text.secondary,
  'text-muted': colors.text.muted,
  'text-inverse': colors.text.inverse,
  'text-disabled': colors.text.disabled,
} as const


