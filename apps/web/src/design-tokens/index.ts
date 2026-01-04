/**
 * Design tokens - единый источник истины
 * Все токены экспортируются отсюда
 */

export * from './colors'
export * from './typography'
export * from './spacing'
export * from './radius'
export * from './elevation'
export * from './motion'
export * from './zIndex'
export * from './breakpoints'

// Re-export all vars for convenience
import { colorVars } from './colors'
import { typographyVars } from './typography'
import { spacingVars } from './spacing'
import { radiusVars } from './radius'
import { elevationVars } from './elevation'
import { motionVars } from './motion'
import { zIndexVars } from './zIndex'
import { breakpointVars } from './breakpoints'

export const allVars = {
  ...colorVars,
  ...typographyVars,
  ...spacingVars,
  ...radiusVars,
  ...elevationVars,
  ...motionVars,
  ...zIndexVars,
  ...breakpointVars,
} as const


