import { motion, AnimatePresence } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { fetchMe, type MeResponse } from '@/shared/api/me'
import { Stack } from '@/ui'
import clsx from 'clsx'
import styles from './Sidebar.module.css'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isAuthenticated: boolean
  currentPath: string
}

interface NavItem {
  label: string
  path: string
  disabled?: boolean
  icon?: string
}

function Sidebar({ isOpen, onClose, isAuthenticated, currentPath }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [userData, setUserData] = useState<MeResponse | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe().then(setUserData).catch(console.error)
    }
  }, [isAuthenticated])

  const isAdminRoute = location.pathname.startsWith('/admin')

  const mainNavItems: NavItem[] = [
    { label: 'Мои генерации', path: '/generations', disabled: !isAuthenticated, icon: '📄' },
    { label: 'Оплата', path: '/billing', disabled: !isAuthenticated, icon: '💳' },
    { label: 'Профиль', path: '/profile', disabled: !isAuthenticated, icon: '⚙️' },
  ]

  const adminNavItems: NavItem[] = [
    { label: 'Модели и роутинг', path: '/admin/models', icon: '🤖' },
    { label: 'Пользователи', path: '/admin/users', icon: '👥' },
    { label: 'История генераций', path: '/admin/generations', icon: '📜' },
    { label: 'Аналитика P&L', path: '/admin/analytics', icon: '📊' },
    { label: 'Выйти из админки', path: '/', icon: '🚪' },
  ]

  const navItems = isAdminRoute ? adminNavItems : mainNavItems

  const handleNavClick = (item: NavItem) => {
    if (item.disabled) return
    navigate(item.path)
    
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.sidebarOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.base }}
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className={styles.sidebar}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
            }}
          >
            <div className={styles.sidebarContent}>
              <Link 
                to="/"
                className={styles.sidebarLogo} 
                onClick={() => {
                  if (window.innerWidth < 1024) onClose()
                }}
                style={{ 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-12)',
                  padding: 'var(--spacing-32) var(--spacing-24) var(--spacing-16)'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'var(--color-neutral-100)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-neutral-0)',
                  flexShrink: 0
                }}>
                  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 7.5L6 12.5L17 1.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div 
                  style={{ 
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    letterSpacing: '-0.02em',
                    color: 'var(--color-neutral-100)'
                  }}
                >
                  {isAdminRoute ? 'Админка' : 'Зачёт'}
                </div>
              </Link>

              {userData?.telegram_username && (
                <div style={{ padding: '0 var(--spacing-24) var(--spacing-16)', fontSize: 'var(--font-size-sm)', color: 'var(--color-accent-base)', fontWeight: 600 }}>
                  @{userData.telegram_username}
                </div>
              )}

              <nav className={styles.sidebarNav} aria-label="Основная навигация">
                <ul className={styles.sidebarList}>
                  {navItems.map((item) => {
                    const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path))
                    return (
                      <li key={item.path}>
                        <button
                          className={clsx(
                            styles.sidebarItem,
                            item.disabled && styles.sidebarItemDisabled,
                            isActive && styles.sidebarItemActive
                          )}
                          disabled={item.disabled}
                          onClick={() => handleNavClick(item)}
                          aria-label={item.disabled ? `${item.label} (скоро будет доступно)` : item.label}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <span className={styles.sidebarItemLabel}>
                            {item.icon && <span style={{ marginRight: '12px' }}>{item.icon}</span>}
                            {item.label}
                          </span>
                          {item.disabled && (
                            <span className={styles.sidebarItemHint} aria-hidden="true">
                              Скоро
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                  {!isAdminRoute && userData?.role === 'admin' && (
                    <li>
                      <button
                        className={styles.sidebarItem}
                        onClick={() => navigate('/admin')}
                      >
                        <span className={styles.sidebarItemLabel}>
                          <span style={{ marginRight: '12px' }}>⚙️</span>
                          Панель управления
                        </span>
                      </button>
                    </li>
                  )}
                </ul>

                {!isAdminRoute && (
                  <div className={styles.sidebarReferralTop}>
                    <button className={styles.referralBlock} onClick={() => navigate('/referral')}>
                      <span className={styles.referralIcon}>🎁</span>
                      <div className={styles.referralContent}>
                        <span className={styles.referralTitle}>Реферальная ссылка</span>
                        <span className={styles.referralSubtitle}>Пригласи друга и получи бонус</span>
                      </div>
                    </button>
                  </div>
                )}

                {isAuthenticated && userData && !isAdminRoute && (
                  <div className={styles.sidebarCreditsTop}>
                    <div className={styles.creditsDisplayBlock}>
                      <div className={styles.creditsDisplayIcon}>💎</div>
                      <div className={styles.creditsDisplayInfo}>
                        <span className={styles.creditsDisplayLabel}>Баланс кредитов</span>
                        <span className={styles.creditsDisplayValue}>{userData.usage.creditsBalance ?? 0} кр.</span>
                      </div>
                    </div>
                  </div>
                )}
              </nav>

              <div className={styles.sidebarFooter}>
                <Stack gap="lg">
                  <div className={styles.sidebarLegal}>
                    <Link to="/terms" className={styles.legalLink}>Пользовательское соглашение сервиса Зачёт</Link>
                    <Link to="/privacy" className={styles.legalLink}>Политика обработки персональных данных</Link>
                  </div>
                </Stack>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
