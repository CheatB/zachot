/**
 * AppBoundary
 * Единая точка принятия решений о состоянии UI
 */

import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import GlobalLoader from './ui/GlobalLoader'
import UnauthPage from './pages/UnauthPage'
import AppShell from './layout/AppShell'

interface AppBoundaryProps {
  children: ReactNode
}

function AppBoundary({ children }: AppBoundaryProps) {
  const { isAuthResolved, isAuthenticated, user } = useAuth()
  const location = useLocation()
  
  // 1. Auth ещё не resolved — показываем loader
  if (!isAuthResolved) {
    return <GlobalLoader />
  }

  // 2. Auth resolved, но пользователь не authenticated — показываем UnauthPage
  if (!isAuthenticated) {
    return <UnauthPage />
  }

  // 3. Если это админ-маршрут — рендерим детей напрямую (у них свой Layout)
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>
  }

  // 4. Обычные страницы — показываем в стандартном Shell
  return (
    <AppShell isAuthenticated={isAuthenticated} user={user}>
      {children}
    </AppShell>
  )
}

export default AppBoundary





