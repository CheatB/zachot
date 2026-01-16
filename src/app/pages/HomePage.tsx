/**
 * HomePage
 * Главная страница приложения
 */

import { useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { EmptyState } from '@/ui'
import { fetchHealth } from '@/shared/api/health'
import { ApiError } from '@/shared/api/http'

function HomePage() {
  const { isAuthenticated } = useAuth()

  // Hook MUST be before any conditional returns
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

  // Conditional returns AFTER all hooks
  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Войдите через лэндинг"
        description="Для доступа к продукту необходимо войти через лэндинг"
      />
    )
  }

  return (
    <EmptyState
      title="Вы успешно вошли в продукт"
      description="Продукт загружается. Функции скоро станут доступны"
    />
  )
}

export default HomePage
