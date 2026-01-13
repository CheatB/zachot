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
import styles from './AppShell.module.css'

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
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % emojis.length
    return emojis[index]
  }

  return (
    <div className={styles.appShellWrapper}>
      <div className={styles.appShell}>
        {/* Floating User Avatar - Top Right "in the air" */}
        <div className={styles.floatingUser} ref={menuRef}>
          {!isDesktop && (
            <button
              className={styles.menuToggle}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Открыть меню"
            >
              ☰
            </button>
          )}
          
          {user ? (
            <div className={styles.userDropdownWrapper}>
              <button 
                className={styles.userAvatarBtn} 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Открыть меню пользователя"
                aria-expanded={isMenuOpen}
              >
                <span className={styles.userAvatarEmoji}>{getRandomEmoji(user.id)}</span>
              </button>

              {isMenuOpen && (
                <div className={styles.userDropdownMenu}>
                  <div className={styles.userDropdownHeader}>
                    <span className={styles.userDropdownId}>
                      {user.telegram_username ? `@${user.telegram_username}` : (user.email || `ID: ${user.id.substring(0, 8)}...`)}
                    </span>
                  </div>
                  <nav className={styles.userDropdownNav}>
                    <Link to="/profile" className={styles.userDropdownItem} onClick={() => setIsMenuOpen(false)}>
                      ⚙️ Профиль
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className={styles.userDropdownItem} onClick={() => setIsMenuOpen(false)}>
                        🛡️ Админ-панель
                      </Link>
                    )}
                    <div className={styles.userDropdownDivider} />
                    <button className={clsx(styles.userDropdownItem, styles.userDropdownItemDanger)} onClick={handleLogout}>
                      🚪 Выйти
                    </button>
                  </nav>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className={styles.appShellContainer}>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isAuthenticated={isAuthenticated}
            currentPath={location.pathname}
          />

          <main className={clsx(styles.appShellMain, sidebarOpen && isDesktop && styles.appShellMainWithSidebar)}>
            <div className={styles.appShellContentLimit}>
              <Stack gap="lg" style={{ padding: 'var(--spacing-32)' }}>
                {children}
              </Stack>
            </div>
          </main>
        </div>

        {!isDesktop && <MobileNav isAuthenticated={isAuthenticated} currentPath={location.pathname} />}
      </div>
    </div>
  )
}

export default AppShell
