/**
 * Elevation design tokens
 * Soft shadows for depth (0/1/2/3/4)
 */

export const elevation = {
  0: 'none',
  1: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  2: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  3: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  4: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
} as const

export const elevationVars = {
  'elevation-0': elevation[0],
  'elevation-1': elevation[1],
  'elevation-2': elevation[2],
  'elevation-3': elevation[3],
  'elevation-4': elevation[4],
} as const


