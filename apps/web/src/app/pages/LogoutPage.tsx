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
    sessionStorage.removeItem('zachot_first_time')
    sessionStorage.removeItem('zachot_has_generations')
    
    logout()
    navigate('/')
  }, [logout, navigate])

  return null
}

export default LogoutPage

