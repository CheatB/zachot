/**
 * LogoutPage
 * Страница выхода - очищает auth и редиректит
 */

import { useEffect } from 'react'
import { useAuth } from '../auth/useAuth'

function LogoutPage() {
  const { logout } = useAuth()

  useEffect(() => {
    // Очищаем first-time флаги при logout
    sessionStorage.removeItem('zachot_first_time')
    sessionStorage.removeItem('zachot_has_generations')
    
    logout()
    // Редирект на внешний лендинг после выхода
    window.location.href = 'https://zachet.tech'
  }, [logout])

  return null
}

export default LogoutPage

