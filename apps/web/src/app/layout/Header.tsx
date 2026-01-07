/**
 * Header component
 * Логотип + user indicator
 * Updated for "juicy" landing page aesthetic
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

interface HeaderProps {
  user: { id: string } | null
  onMenuClick?: () => void
}

function Header({ user, onMenuClick }: HeaderProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const getInitials = (userId: string): string => {
    if (!userId) return '??'
    const cleanId = userId.replace(/-/g, '')
    return cleanId.substring(0, 2).toUpperCase()
  }

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
    navigate('/')
  }

  // Закрытие по клику вне меню
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        
        <div className="app-header__right" ref={menuRef}>
          {user ? (
            <div className="app-header__user-wrapper">
              <button 
                className="app-header__avatar" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Открыть меню пользователя"
                aria-expanded={isMenuOpen}
              >
                {getInitials(user.id)}
              </button>

              {isMenuOpen && (
                <div className="app-header__dropdown">
                  <div className="app-header__dropdown-header">
                    <span className="app-header__dropdown-id">ID: {user.id.substring(0, 8)}...</span>
                  </div>
                  <nav className="app-header__dropdown-nav">
                    <Link to="/account" className="app-header__dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      👤 Аккаунт
                    </Link>
                    <Link to="/profile" className="app-header__dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      ⚙️ Профиль
                    </Link>
                    <Link to="/admin" className="app-header__dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      🛡️ Админ-панель
                    </Link>
                    <div className="app-header__dropdown-divider" />
                    <button className="app-header__dropdown-item app-header__dropdown-item--danger" onClick={handleLogout}>
                      🚪 Выйти
                    </button>
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <div className="app-header__user">
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                Вход не выполнен
              </span>
            </div>
          )}
        </div>
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

.app-header__user-wrapper {
  position: relative;
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
  border: none;
  padding: 0;
}

.app-header__avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.3);
}

.app-header__dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-12));
  right: 0;
  width: 240px;
  background-color: var(--color-surface-base);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--elevation-3);
  padding: var(--spacing-8);
  display: flex;
  flex-direction: column;
  z-index: var(--z-index-dropdown);
  animation: dropdown-fade-in 0.2s var(--motion-easing-out);
}

@keyframes dropdown-fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.app-header__dropdown-header {
  padding: var(--spacing-8) var(--spacing-12);
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: var(--spacing-8);
}

.app-header__dropdown-id {
  font-size: 10px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.app-header__dropdown-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-12) var(--spacing-16);
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  transition: background-color 0.2s ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.app-header__dropdown-item:hover {
  background-color: var(--color-neutral-10);
}

.app-header__dropdown-item--danger {
  color: var(--color-danger-base);
}

.app-header__dropdown-item--danger:hover {
  background-color: var(--color-danger-light);
}

.app-header__dropdown-divider {
  height: 1px;
  background-color: var(--color-border-light);
  margin: var(--spacing-8) 0;
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
