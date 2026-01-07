/**
 * LoginPage
 * Страница входа (заглушка)
 */

import AppShell from '../layout/AppShell'
import { EmptyState } from '@/ui'
import { useAuth } from '../auth/useAuth'

function LoginPage() {
  const { isAuthenticated, user } = useAuth()
  
  return (
    <AppShell isAuthenticated={isAuthenticated} user={user}>
      <EmptyState
        title="Вход через лэндинг"
        description="Для входа в продукт используйте лэндинг"
      />
    </AppShell>
  )
}

export default LoginPage


