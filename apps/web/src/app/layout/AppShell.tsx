/**
 * AppShell component
 * Основной shell приложения с Header, Sidebar, MobileNav
 * ❗️НЕ использует useAuth — только props
 */

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import Stack from '@/ui/layout/Stack'

interface AppShellProps {
  isAuthenticated: boolean
  user: { id: string } | null
  children: ReactNode
}

function AppShell({ isAuthenticated, user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname
    }
    return '/'
  })

  // Синхронизация с window.location (не требует Router контекста)
  useEffect(() => {
    const updatePath = () => {
      if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname)
      }
    }

    // Обновляем при изменении пути через history API
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      updatePath()
    }

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      updatePath()
    }

    // Слушаем popstate (назад/вперед)
    window.addEventListener('popstate', updatePath)

    // Логирование для отладки
    if (typeof window !== 'undefined') {
      console.log('[AppShell] Render:', {
        isAuthenticated,
        user: user?.id,
        pathname: currentPath,
        timestamp: new Date().toISOString(),
      })
    }

    return () => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
      window.removeEventListener('popstate', updatePath)
    }
  }, [isAuthenticated, user, currentPath])

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
  overflow-y: auto;
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
