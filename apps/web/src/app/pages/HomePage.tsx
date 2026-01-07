/**
 * HomePage
 * Главная страница приложения
 */

import { useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import AppShell from '../layout/AppShell'
import { EmptyState } from '@/ui'
import { fetchHealth } from '@/shared/api/health'
import { ApiError } from '@/shared/api/http'

function HomePage() {
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    fetchHealth()
      .then(() => {
        console.log('API HEALTH OK')
      })
      .catch((error) => {
        if (error instanceof ApiError) {
          console.error('API HEALTH ERROR', error.status, error.message)
        } else {
          console.error('API HEALTH ERROR', error)
        }
      })
  }, [])

  if (!isAuthenticated) {
    return (
      <AppShell isAuthenticated={isAuthenticated} user={user}>
        <EmptyState
          title="Войдите через лэндинг"
          description="Для доступа к продукту необходимо войти через лэндинг"
        />
      </AppShell>
    )
  }

  return (
    <AppShell isAuthenticated={isAuthenticated} user={user}>
      <EmptyState
        title="Вы успешно вошли в продукт"
        description="Продукт загружается. Функции скоро станут доступны"
      />
    </AppShell>
  )
}

export default HomePage


