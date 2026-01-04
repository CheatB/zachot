/**
 * Accessibility utilities
 */

/**
 * Screen reader only text
 */
export const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  borderWidth: 0,
}

/**
 * Generate unique ID for ARIA attributes
 */
let idCounter = 0
export const generateId = (prefix = 'id'): string => {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

/**
 * ARIA live region announcements
 */
export const announceToScreenReader = (message: string): void => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  Object.assign(announcement.style, srOnly)
  announcement.textContent = message
  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}


