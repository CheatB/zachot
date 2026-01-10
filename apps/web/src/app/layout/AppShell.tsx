/**
 * AppShell component
 * Основной shell приложения с Sidebar и MobileNav
 * Header удален, аватар теперь плавает в углу
 */

import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import Stack from '@/ui/layout/Stack'
import { type User } from '../auth/authTypes'
import { useAuth } from '../auth/useAuth'

interface AppShellProps {
  isAuthenticated: boolean
  user: User | null
  children: ReactNode
}

function AppShell({ isAuthenticated, user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const currentPath = location.pathname
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Определение размера экрана
  useEffect(() => {
    const checkDesktop = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      setSidebarOpen(desktop)
    }

    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

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

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
    navigate('/login')
  }

  const getRandomEmoji = (userId: string): string => {
    const emojis = ['🎓', '🚀', '🧠', '📚', '💡', '✍️', '🧪', '🔭', '🎨', '💻', '🌍', '⚡️']
    // Используем ID пользователя как сид для выбора одного и того же эмодзи для одного юзера
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % emojis.length
    return emojis[index]
  }

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'app-shell-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = appShellStyles
    }
  }, [])

  return (
    <div className="app-shell-wrapper">
      <div className="app-shell">
        {/* Floating User Avatar - Top Right "in the air" */}
        <div className="app-shell__floating-user" ref={menuRef}>
          {!isDesktop && (
            <button
              className="app-shell__menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Открыть меню"
            >
              ☰
            </button>
          )}
          
          {user ? (
            <div className="user-dropdown-wrapper">
              <button 
                className="user-avatar-btn" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Открыть меню пользователя"
                aria-expanded={isMenuOpen}
              >
                <span className="user-avatar-emoji">{getRandomEmoji(user.id)}</span>
              </button>

              {isMenuOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <span className="user-dropdown-id">
                      {user.telegram_username ? `@${user.telegram_username}` : (user.email || `ID: ${user.id.substring(0, 8)}...`)}
                    </span>
                  </div>
                  <nav className="user-dropdown-nav">
                    <Link to="/profile" className="user-dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      ⚙️ Профиль
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="user-dropdown-item" onClick={() => setIsMenuOpen(false)}>
                        🛡️ Админ-панель
                      </Link>
                    )}
                    <div className="user-dropdown-divider" />
                    <button className="user-dropdown-item user-dropdown-item--danger" onClick={handleLogout}>
                      🚪 Выйти
                    </button>
                  </nav>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="app-shell__container">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isAuthenticated={isAuthenticated}
            currentPath={currentPath}
          />

          <main className={clsx('app-shell__main', sidebarOpen && isDesktop && 'app-shell__main--with-sidebar')}>
            <div className="app-shell__content-limit">
              <Stack gap="lg" style={{ padding: 'var(--spacing-32)' }}>
                {children}
              </Stack>
            </div>
          </main>
        </div>

        {!isDesktop && <MobileNav isAuthenticated={isAuthenticated} currentPath={currentPath} />}
      </div>
    </div>
  )
}

export default AppShell

// --------------------
// Styles
// --------------------
const appShellStyles = `
.app-shell-wrapper {
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-surface-base);
  display: flex;
  justify-content: center;
}

.app-shell {
  display: flex;
  width: 100%;
  max-width: 1600px; /* Ограничение ширины всего приложения */
  min-height: 100vh;
  position: relative;
  background-color: var(--color-surface-base);
}

.app-shell__floating-user {
  position: absolute; /* Теперь привязан к app-shell, а не к окну */
  top: var(--spacing-16);
  right: var(--spacing-24);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: var(--spacing-16);
}

.app-shell__menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background-color: var(--color-surface-base);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 20px;
  box-shadow: var(--elevation-1);
}

.user-dropdown-wrapper {
  position: relative;
}

.user-avatar-btn {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: white;
  color: var(--color-text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--motion-duration-base) var(--motion-easing-out);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid var(--color-accent-base);
  padding: 0;
}

.user-avatar-emoji {
  font-size: 24px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.15);
}

.user-dropdown-menu {
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
  z-index: 1001;
  animation: dropdown-fade-in 0.2s var(--motion-easing-out);
}

@keyframes dropdown-fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-dropdown-header {
  padding: var(--spacing-8) var(--spacing-12);
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: var(--spacing-8);
}

.user-dropdown-id {
  font-size: 10px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.user-dropdown-item {
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

.user-dropdown-item:hover {
  background-color: var(--color-neutral-10);
}

.user-dropdown-item--danger {
  color: var(--color-danger-base);
}

.user-dropdown-item--danger:hover {
  background-color: var(--color-danger-light);
}

.user-dropdown-divider {
  height: 1px;
  background-color: var(--color-border-light);
  margin: var(--spacing-8) 0;
}

.app-shell__container {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.app-shell__main {
  flex: 1;
  background-color: var(--color-surface-base);
  min-height: 100vh;
  transition: margin-left var(--motion-duration-base) var(--motion-easing-out);
}

@media (min-width: 1024px) {
  .app-shell__main--with-sidebar {
    margin-left: 280px;
  }
}

.app-shell__content-limit {
  width: 100%;
  margin: 0;
}

@media (max-width: 1024px) {
  .app-shell__container {
    flex-direction: column;
  }
  .app-shell__main {
    padding-bottom: var(--spacing-80);
  }
}
`
