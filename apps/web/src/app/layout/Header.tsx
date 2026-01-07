/**
 * Header component
 * Логотип + user indicator
 * Updated for "juicy" landing page aesthetic
 */

import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  user: { id: string } | null
  onMenuClick?: () => void
}

function Header({ user, onMenuClick }: HeaderProps) {
  const navigate = useNavigate()

  const getInitials = (userId: string): string => {
    if (!userId) return '??'
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
          <div 
            className="app-header__logo-container" 
            onClick={() => navigate('/')}
            style={{ 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-12)'
            }}
          >
            <div className="app-header__logo-icon" style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'var(--color-neutral-100)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-neutral-0)'
            }}>
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 7.5L6 12.5L17 1.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div 
              className="app-header__logo-text" 
              style={{ 
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                letterSpacing: '-0.02em',
                color: 'var(--color-neutral-100)'
              }}
            >
              Зачёт
            </div>
          </div>
        </div>
        {user ? (
          <div className="app-header__user">
            <div className="app-header__avatar" aria-label={`Пользователь ${user.id}`}>
              {getInitials(user.id)}
            </div>
          </div>
        ) : (
          <div className="app-header__user">
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              Вход не выполнен
            </span>
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
  border-bottom: 1px solid var(--color-border-base);
  position: sticky;
  top: 0;
  z-index: var(--z-index-dropdown);
  backdrop-filter: blur(8px);
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
  width: 44px;
  height: 44px;
  padding: 0;
  background-color: var(--color-neutral-10);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--motion-duration-base) var(--motion-easing-out);
}

@media (min-width: 1024px) {
  .app-header__menu-button {
    display: none;
  }
}

.app-header__menu-button:hover {
  background-color: var(--color-neutral-20);
  transform: translateY(-1px);
}

.app-header__avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: var(--color-accent-base);
  color: var(--color-text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all var(--motion-duration-base) var(--motion-easing-out);
  box-shadow: 0 4px 12px var(--color-accent-shadow);
}

.app-header__avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.3);
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
