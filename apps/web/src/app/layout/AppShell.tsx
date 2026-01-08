/**
 * AppShell component
 * Основной shell приложения с Header, Sidebar, MobileNav
 * ❗️НЕ использует useAuth — только props
 */

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import Stack from '@/ui/layout/Stack'
import { type User } from '../auth/authTypes'

interface AppShellProps {
  isAuthenticated: boolean
  user: User | null
  children: ReactNode
}

function AppShell({ isAuthenticated, user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const location = useLocation()
  const currentPath = location.pathname

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

  // ❗️Если не авторизован — просто рендерим контент без shell
  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="app-shell">
      <Header user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="app-shell__body">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isAuthenticated={isAuthenticated}
          currentPath={currentPath}
        />

        <main className="app-shell__main">
          <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <Stack gap="lg" style={{ padding: 'var(--spacing-32)' }}>
              {children}
            </Stack>
          </div>
        </main>
      </div>

      {!isDesktop && <MobileNav isAuthenticated={isAuthenticated} currentPath={currentPath} />}
    </div>
  )
}

export default AppShell

// --------------------
// Styles (без изменений)
// --------------------
const appShellStyles = `
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-surface-base);
}

.app-shell__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-shell__main {
  flex: 1;
  padding-bottom: var(--spacing-64);
}

@media (min-width: 1024px) {
  .app-shell__main {
    padding-bottom: var(--spacing-24);
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'app-shell-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = appShellStyles
    document.head.appendChild(style)
  }
}
