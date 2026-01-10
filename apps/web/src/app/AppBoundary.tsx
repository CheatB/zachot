/**
 * AppBoundary
 * Единая точка принятия решений о состоянии UI
 */

import { ReactNode } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import GlobalLoader from './ui/GlobalLoader'
import LoginPage from './pages/LoginPage'
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

  // 2. Разрешаем доступ к странице выхода без проверки
  if (location.pathname === '/logout') {
    return <>{children}</>
  }

  // 3. Если не авторизован и не на странице логина — редирект на /login
  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  // 4. Если на странице логина и не авторизован — показываем LoginPage
  if (!isAuthenticated && location.pathname === '/login') {
    return <LoginPage />
  }

  // 5. Все остальные страницы — в Shell
  return (
    <AppShell isAuthenticated={isAuthenticated} user={user}>
      {children}
    </AppShell>
  )
}

export default AppBoundary
