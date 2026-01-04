/**
 * Header component
 * Логотип + user indicator
 */

import { useAuth } from '../auth/useAuth'

interface HeaderProps {
  onMenuClick?: () => void
}

function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth()

  // Получить инициалы из UUID (первые две буквы)
  const getInitials = (userId: string): string => {
    // Берем первые два символа UUID (после дефисов)
    const cleanId = userId.replace(/-/g, '')
    return cleanId.substring(0, 2).toUpperCase()
  }

  return (
    <header className="app-header">
      <div className="app-header__container">
        <div className="app-header__left">
          {onMenuClick && (
            <button
              className="app-header__menu-button"
              onClick={onMenuClick}
              aria-label="Открыть меню"
            >
              <span className="app-header__menu-icon">☰</span>
            </button>
          )}
          <div className="app-header__logo">Zachot</div>
        </div>
        {user && (
          <div className="app-header__user">
            <div className="app-header__avatar" aria-label={`Пользователь ${user.id}`}>
              {getInitials(user.id)}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header

const headerStyles = `
.app-header {
  width: 100%;
  background-color: var(--color-surface-base);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: var(--z-index-dropdown);
}

.app-header__container {
  max-width: 100%;
  margin: 0 auto;
  padding: var(--spacing-16) var(--spacing-24);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-header__left {
  display: flex;
  align-items: center;
  gap: var(--spacing-16);
}

.app-header__menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background-color: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--motion-duration-base) ease;
}

@media (min-width: 1024px) {
  .app-header__menu-button {
    display: none;
  }
}

.app-header__menu-button:hover {
  background-color: var(--color-neutral-20);
}

.app-header__menu-button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring-offset);
}

.app-header__menu-icon {
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
  line-height: 1;
}

@media (min-width: 1024px) {
  .app-header__container {
    padding: var(--spacing-20) var(--spacing-32);
  }
}

.app-header__logo {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.app-header__user {
  display: flex;
  align-items: center;
}

.app-header__avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent-base);
  color: var(--color-text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: transform var(--motion-duration-fast) ease;
}

.app-header__avatar:hover {
  transform: scale(1.05);
}

.app-header__avatar:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring-offset);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'app-header-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = headerStyles
    document.head.appendChild(style)
  }
}

