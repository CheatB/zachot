/**
 * LogoutPage
 * Страница выхода - очищает auth и редиректит
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

function LogoutPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Очищаем first-time флаги при logout
    localStorage.removeItem('zachot_auth_token')
    localStorage.removeItem('zachot_auth_user_id')
    localStorage.removeItem('zachot_refresh_token')
    localStorage.removeItem('zachot_first_time')
    localStorage.removeItem('zachot_has_generations')
    
    logout()
    // Редирект на страницу логина внутри приложения
    navigate('/login', { replace: true })
  }, [logout, navigate])

  return null
}

export default LogoutPage

