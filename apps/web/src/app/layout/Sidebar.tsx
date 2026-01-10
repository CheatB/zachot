import { motion, AnimatePresence } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { fetchMe, type MeResponse } from '@/shared/api/me'
import { Stack, Button } from '@/ui'
import clsx from 'clsx'
import { useCreateStore } from '@/features/create-generation/store/useCreateStore'

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
  const { resetForm } = useCreateStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe().then(setUserData).catch(console.error)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'app-sidebar-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = sidebarStyles
    }
  }, [])

  const isAdminRoute = location.pathname.startsWith('/admin')
  const isHomePage = location.pathname === '/' || location.pathname === '/login'

  const mainNavItems: NavItem[] = [
    { label: 'Мои генерации', path: '/generations', disabled: !isAuthenticated, icon: '📄' },
    { label: 'Оплата', path: '/billing', disabled: !isAuthenticated, icon: '💳' },
    { label: 'Профиль', path: '/profile', disabled: !isAuthenticated, icon: '⚙️' },
  ]

  const adminNavItems: NavItem[] = [
    { label: 'Модели и роутинг', path: '/admin/models', icon: '🤖' },
    { label: 'Пользователи', path: '/admin/users', icon: '👥' },
    { label: 'Аналитика P&L', path: '/admin/analytics', icon: '📊' },
    { label: 'Выйти из админки', path: '/', icon: '🚪' },
  ]

  const navItems = isAdminRoute ? adminNavItems : mainNavItems

  const handleLogoClick = () => {
    resetForm()
    navigate('/')
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const handleNavClick = (item: NavItem) => {
    if (item.disabled) return
    navigate(item.path)
    
    // Закрываем сайдбар только на мобильных устройствах
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const remainingGens = userData ? userData.usage.generationsLimit - userData.usage.generationsUsed : 0

  return (
    <>
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
            <div className="app-sidebar__content">
              <div 
                className="app-sidebar__logo" 
                onClick={handleLogoClick}
                style={{ 
                  cursor: 'pointer',
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
              </div>

              {userData?.telegram_username && (
                <div style={{ padding: '0 var(--spacing-24) var(--spacing-16)', fontSize: 'var(--font-size-sm)', color: 'var(--color-accent-base)', fontWeight: 600 }}>
                  @{userData.telegram_username}
                </div>
              )}

              <nav className="app-sidebar__nav" aria-label="Основная навигация">
                <ul className="app-sidebar__list">
                  {navItems.map((item) => {
                    const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path))
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
                          <span className="app-sidebar__item-label">
                            {item.icon && <span style={{ marginRight: '12px' }}>{item.icon}</span>}
                            {item.label}
                          </span>
                          {item.disabled && (
                            <span className="app-sidebar__item-hint" aria-hidden="true">
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
                        className="app-sidebar__item"
                        onClick={() => navigate('/admin')}
                      >
                        <span className="app-sidebar__item-label">
                          <span style={{ marginRight: '12px' }}>⚙️</span>
                          Панель управления
                        </span>
                      </button>
                    </li>
                  )}
                </ul>

                {!isAdminRoute && (
                  <div className="app-sidebar__referral-top">
                    <button className="referral-block" onClick={() => navigate('/referral')}>
                      <span className="referral-icon">🎁</span>
                      <div className="referral-content">
                        <span className="referral-title">Реферальная ссылка</span>
                        <span className="referral-subtitle">Пригласи друга и получи бонус</span>
                      </div>
                    </button>
                  </div>
                )}
              </nav>

              <div className="app-sidebar__footer">
                <Stack gap="lg">
                  {isAuthenticated && userData && isHomePage && !isAdminRoute && (
                    <div className="app-sidebar__usage">
                      <div className="usage-info">
                        <span className="usage-label">Осталось генераций:</span>
                        <span className={clsx('usage-value', remainingGens === 0 && 'usage-value--empty')}>
                          {remainingGens}
                        </span>
                      </div>
                      {remainingGens === 0 && (
                        <Button variant="primary" size="sm" onClick={() => navigate('/billing')} style={{ marginTop: 'var(--spacing-8)', width: '100%' }}>
                          Докупить
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="app-sidebar__legal">
                    <Link to="/terms" className="legal-link">Пользовательское соглашение сервиса Зачёт</Link>
                    <Link to="/privacy" className="legal-link">Политика обработки персональных данных</Link>
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
  background-color: var(--color-neutral-10);
  border-right: 1px solid var(--color-border-base);
  z-index: var(--z-index-modal);
  overflow-y: auto;
}

@media (min-width: 1024px) {
  .app-sidebar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100vh;
    width: 280px;
    flex-shrink: 0;
    background-color: var(--color-surface-base);
    border-right: 1px solid var(--color-border-base);
    z-index: var(--z-index-sticky);
  }
}

.app-sidebar__content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
}

.app-sidebar__logo {
  padding: var(--spacing-32) var(--spacing-24);
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.app-sidebar__nav {
  padding: var(--spacing-24);
  flex: 1;
  overflow-y: auto;
}

.app-sidebar__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-24); /* Увеличено расстояние (было 16) */
  list-style: none;
  margin-bottom: var(--spacing-32);
}

.app-sidebar__referral-top {
  width: 100%;
  margin-top: var(--spacing-24);
}

.app-sidebar__item {
  width: 100%;
  padding: var(--spacing-12) var(--spacing-20);
  font-size: var(--font-size-xl); /* Увеличено на 4px (было base/16px, стало xl/20px) */
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-80);
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
  transition: all var(--motion-duration-base) var(--motion-easing-out);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-sidebar__item:hover:not(:disabled) {
  background-color: var(--color-neutral-20);
  color: var(--color-text-primary);
  transform: translateX(4px);
}

.app-sidebar__item--active {
  background-color: var(--color-accent-light);
  color: var(--color-accent-base);
  border-color: var(--color-accent-base);
  font-weight: var(--font-weight-bold);
  justify-content: center;
}

.app-sidebar__item--active .app-sidebar__item-label {
  flex: none;
  justify-content: center;
}

.app-sidebar__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.app-sidebar__item-label {
  flex: 1;
  display: flex;
  align-items: center;
}

.app-sidebar__item-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-normal);
  background: var(--color-neutral-20);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.app-sidebar__footer {
  padding: var(--spacing-24);
  border-top: 1px solid var(--color-border-light);
  background-color: var(--color-neutral-10);
}

.app-sidebar__usage {
  padding: var(--spacing-12) var(--spacing-16);
  background-color: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-base);
  margin-bottom: var(--spacing-48); /* Увеличен еще больше для "воздуха" */
}

.usage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.usage-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.usage-value {
  font-size: var(--font-size-sm);
  font-weight: bold;
  color: var(--color-accent-base);
}

.usage-value--empty {
  color: var(--color-danger-base);
}

.app-sidebar__referral {
  width: 100%;
}

.referral-block {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
  padding: var(--spacing-12) var(--spacing-16);
  background-color: var(--color-accent-light);
  border: 1px dashed var(--color-accent-base);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.referral-block:hover {
  background-color: white;
  transform: translateY(-2px);
  box-shadow: var(--elevation-1);
}

.referral-icon {
  font-size: 24px;
}

.referral-content {
  display: flex;
  flex-direction: column;
}

.referral-title {
  font-size: var(--font-size-sm);
  font-weight: bold;
  color: var(--color-accent-base);
}

.referral-subtitle {
  font-size: 10px;
  color: var(--color-text-muted);
}

.app-sidebar__legal {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.legal-link {
  font-size: 10px;
  color: var(--color-text-muted);
  text-decoration: none;
  line-height: 1.4;
}

.legal-link:hover {
  color: var(--color-accent-base);
  text-decoration: underline;
}
`
