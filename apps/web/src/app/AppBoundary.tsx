/**
 * AppBoundary
 * Единая точка принятия решений о состоянии UI
 */

import { ReactNode, useEffect } from 'react'
import { useAuth } from './auth/useAuth'
import GlobalLoader from './ui/GlobalLoader'
import UnauthPage from './pages/UnauthPage'

interface AppBoundaryProps {
  children: ReactNode
}

function AppBoundary({ children }: AppBoundaryProps) {
  console.log('[AppBoundary] Component rendering, about to call useAuth()...')
  
  const { isAuthResolved, isAuthenticated } = useAuth()
  
  console.log('[AppBoundary] useAuth() succeeded:', {
    isAuthResolved,
    isAuthenticated,
  })

  // Логирование для отладки
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[AppBoundary] Auth state:', {
        isAuthResolved,
        isAuthenticated,
        timestamp: new Date().toISOString(),
      })
    }
  }, [isAuthResolved, isAuthenticated])

  // 1. Auth ещё не resolved — показываем loader
  if (!isAuthResolved) {
    return <GlobalLoader />
  }

  // 2. Auth resolved, но пользователь не authenticated — показываем UnauthPage
  if (!isAuthenticated) {
    return <UnauthPage />
  }

  // 3. Auth resolved и authenticated — показываем приложение
  return <>{children}</>
}

export default AppBoundary




