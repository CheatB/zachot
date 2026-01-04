/**
 * Z-index design tokens
 * Layering system for dropdowns, modals, tooltips
 */

export const zIndex = {
  base: 0,
  dropdown: 1000,
  tooltip: 2000,
  modal: 3000,
  overlay: 4000,
} as const

export const zIndexVars = {
  'z-index-base': zIndex.base.toString(),
  'z-index-dropdown': zIndex.dropdown.toString(),
  'z-index-tooltip': zIndex.tooltip.toString(),
  'z-index-modal': zIndex.modal.toString(),
  'z-index-overlay': zIndex.overlay.toString(),
} as const


