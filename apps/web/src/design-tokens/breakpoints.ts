/**
 * Breakpoint design tokens
 * sm=360 md=768 lg=1024 xl=1280
 */

export const breakpoints = {
  sm: '360px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const

export const breakpointVars = {
  'breakpoint-sm': breakpoints.sm,
  'breakpoint-md': breakpoints.md,
  'breakpoint-lg': breakpoints.lg,
  'breakpoint-xl': breakpoints.xl,
} as const

// Media query helpers (for use in JS/TS)
export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
} as const


