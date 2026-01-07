/**
 * UnauthPage
 * Страница для неавторизованных пользователей
 */

import { Button, EmptyState } from '@/ui'

function UnauthPage() {
  const handleLogin = () => {
    console.log('Login button clicked')
    // TODO: Реализовать логику входа
  }

  return (
    <div className="unauth-page">
      <EmptyState
        title="Требуется вход"
        description="Для доступа к приложению необходимо войти через лэндинг"
      >
        <div className="unauth-page__action">
          <Button variant="primary" onClick={handleLogin}>
            Войти
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
  min-height: 60vh;
}

.unauth-page__action {
  margin-top: var(--spacing-24);
  display: flex;
  justify-content: center;
}
`

if (typeof document !== 'undefined') {
  const styleId = 'unauth-page-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = pageStyles
    document.head.appendChild(style)
  }
}
