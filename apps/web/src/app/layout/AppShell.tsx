/**
 * AppShell component
 * Основной shell приложения с Header, Sidebar, MobileNav
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import Header from './Header'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import Stack from '@/ui/layout/Stack'

interface AppShellProps {
  children: React.ReactNode
}

function AppShell({ children }: AppShellProps) {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  // Определение размера экрана
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
      // На desktop sidebar всегда открыт
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="app-shell">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="app-shell__body">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="app-shell__main">
          <Stack gap="lg" style={{ padding: 'var(--spacing-24)' }}>
            {children}
          </Stack>
        </main>
      </div>
      {!isDesktop && <MobileNav />}
    </div>
  )
}

export default AppShell

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

