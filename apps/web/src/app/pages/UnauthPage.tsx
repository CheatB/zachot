/**
 * UnauthPage
 * Страница для неавторизованных пользователей
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, EmptyState } from '@/ui'

function UnauthPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'unauth-page-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = pageStyles
    }
  }, [])

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <div className="unauth-page">
      <EmptyState
        title="Требуется вход"
        description="Для доступа к приложению необходимо авторизоваться"
      >
        <div className="unauth-page__action">
          <Button variant="primary" onClick={handleLogin}>
            Войти в аккаунт
          </Button>
        </div>
      </EmptyState>
    </div>
  )
}

export default UnauthPage

const pageStyles = `
.unauth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.unauth-page__action {
  margin-top: var(--spacing-24);
  display: flex;
  justify-content: center;
}
`
