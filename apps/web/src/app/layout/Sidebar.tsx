/**
 * Sidebar component
 * Desktop navigation sidebar
 */

import { motion, AnimatePresence } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import clsx from 'clsx'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  path: string
  disabled?: boolean
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  const navItems: NavItem[] = [
    { label: 'Generations', path: '/generations', disabled: !isAuthenticated },
    { label: 'Account', path: '/account', disabled: !isAuthenticated },
    { label: 'Billing', path: '/billing', disabled: true },
    { label: 'Profile', path: '/profile', disabled: true },
  ]

  const handleNavClick = (item: NavItem) => {
    if (item.disabled) return
    navigate(item.path)
    onClose()
  }

  return (
    <>
      {/* Overlay для мобильных */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="app-sidebar__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.base }}
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="app-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
            }}
          >
            <nav className="app-sidebar__nav" aria-label="Основная навигация">
              <ul className="app-sidebar__list">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <li key={item.path}>
                      <button
                        className={clsx(
                          'app-sidebar__item',
                          item.disabled && 'app-sidebar__item--disabled',
                          isActive && 'app-sidebar__item--active'
                        )}
                        disabled={item.disabled}
                        onClick={() => handleNavClick(item)}
                        aria-label={item.disabled ? `${item.label} (скоро будет доступно)` : item.label}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="app-sidebar__item-label">{item.label}</span>
                        {item.disabled && (
                          <span className="app-sidebar__item-hint" aria-hidden="true">
                            Скоро
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar

const sidebarStyles = `
.app-sidebar__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-surface-overlay);
  z-index: var(--z-index-modal);
}

@media (min-width: 1024px) {
  .app-sidebar__overlay {
    display: none;
  }
}

.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background-color: var(--color-surface-base);
  border-right: 1px solid var(--color-border-light);
  z-index: var(--z-index-modal);
  overflow-y: auto;
}

@media (min-width: 1024px) {
  .app-sidebar {
    position: relative;
    width: 280px;
    flex-shrink: 0;
  }
}

.app-sidebar__nav {
  padding: var(--spacing-24);
}

.app-sidebar__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  list-style: none;
}

.app-sidebar__item {
  width: 100%;
  padding: var(--spacing-12) var(--spacing-16);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  background-color: transparent;
  border: none;
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
  transition: all var(--motion-duration-base) ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-sidebar__item:hover:not(:disabled) {
  background-color: var(--color-neutral-20);
}

.app-sidebar__item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring-offset);
}

.app-sidebar__item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.app-sidebar__item--disabled:hover {
  background-color: transparent;
}

.app-sidebar__item--active {
  background-color: var(--color-accent-light);
  color: var(--color-accent-base);
  font-weight: var(--font-weight-semibold);
}

.app-sidebar__item-label {
  flex: 1;
}

.app-sidebar__item-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-normal);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'app-sidebar-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = sidebarStyles
    document.head.appendChild(style)
  }
}

