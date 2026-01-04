/**
 * HomePage
 * Главная страница приложения
 */

import { useAuth } from '../auth/useAuth'
import AppShell from '../layout/AppShell'
import { EmptyState } from '@/ui'

function HomePage() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <AppShell>
        <EmptyState
          title="Войдите через лэндинг"
          description="Для доступа к продукту необходимо войти через лэндинг"
        />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <EmptyState
        title="Вы успешно вошли в продукт"
        description="Продукт загружается. Функции скоро станут доступны"
      />
    </AppShell>
  )
}

export default HomePage


