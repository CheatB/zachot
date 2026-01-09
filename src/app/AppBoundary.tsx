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

  // 2. Разрешаем доступ к странице логина и выхода без проверки авторизации
  if (location.pathname === '/login' || location.pathname === '/logout') {
    return <>{children}</>
  }

  // 3. Auth resolved, но пользователь не authenticated — показываем UnauthPage
  if (!isAuthenticated) {
    return <UnauthPage />
  }

  // 3. Все страницы (включая админку) — показываем в стандартном Shell
  return (
    <AppShell isAuthenticated={isAuthenticated} user={user}>
      {children}
    </AppShell>
  )
}

export default AppBoundary
