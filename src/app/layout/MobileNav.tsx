/**
 * MobileNav component
 * Bottom navigation для мобильных устройств
 */

import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

interface MobileNavProps {
  isAuthenticated: boolean
  currentPath: string
}

interface NavItem {
  label: string
  path: string
  disabled?: boolean
}

function MobileNav({ isAuthenticated, currentPath }: MobileNavProps) {
  const navigate = useNavigate()

  const navItems: NavItem[] = [
    { label: 'Generations', path: '/generations', disabled: !isAuthenticated },
    { label: 'Account', path: '/account', disabled: !isAuthenticated },
    { label: 'Admin', path: '/admin', disabled: !isAuthenticated },
  ]

  const handleNavClick = (item: NavItem) => {
    if (item.disabled) return
    navigate(item.path)
  }

  return (
    <nav className="app-mobile-nav" aria-label="Мобильная навигация">
      <ul className="app-mobile-nav__list">
        {navItems.map((item) => {
          const isActive = currentPath === item.path
          return (
            <li key={item.path}>
              <button
                className={clsx(
                  'app-mobile-nav__item',
                  item.disabled && 'app-mobile-nav__item--disabled',
                  isActive && 'app-mobile-nav__item--active'
                )}
                disabled={item.disabled}
                onClick={() => handleNavClick(item)}
                aria-label={item.disabled ? `${item.label} (скоро будет доступно)` : item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="app-mobile-nav__item-label">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default MobileNav

const mobileNavStyles = `
.app-mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--color-surface-base);
  border-top: 1px solid var(--color-border-light);
  z-index: var(--z-index-dropdown);
  padding: var(--spacing-8) var(--spacing-16);
}

@media (min-width: 1024px) {
  .app-mobile-nav {
    display: none;
  }
}

.app-mobile-nav__list {
  display: flex;
  justify-content: space-around;
  align-items: center;
  list-style: none;
  gap: var(--spacing-8);
}

.app-mobile-nav__item {
  flex: 1;
  padding: var(--spacing-12) var(--spacing-8);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  background-color: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--motion-duration-base) ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
}

.app-mobile-nav__item:hover:not(:disabled) {
  background-color: var(--color-neutral-20);
}

.app-mobile-nav__item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring-offset);
}

.app-mobile-nav__item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.app-mobile-nav__item--disabled:hover {
  background-color: transparent;
}

.app-mobile-nav__item--active {
  background-color: var(--color-accent-light);
  color: var(--color-accent-base);
  font-weight: var(--font-weight-semibold);
}

.app-mobile-nav__item-label {
  font-size: var(--font-size-xs);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'app-mobile-nav-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = mobileNavStyles
    document.head.appendChild(style)
  }
}

