/**
 * AppErrorBoundary component
 * Error Boundary для обработки ошибок приложения
 * UI-only, без технических деталей
 */

import { Component, ReactNode } from 'react'
import { Card, Button, EmptyState } from '@/ui'
import AppShell from '../layout/AppShell'
import { Container, Stack } from '@/ui'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

class AppErrorBoundaryClass extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // В production здесь можно отправить ошибку в систему мониторинга
    // Но не логируем в консоль для пользователя
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }

    return this.props.children
  }
}

function ErrorFallback() {
  const handleRefresh = () => {
    window.location.reload()
  }

  const handleGoBack = () => {
    window.location.href = '/generations'
  }

  return (
    <AppShell>
      <Container size="lg">
        <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
          <Card>
            <div className="error-boundary">
              <EmptyState
                title="Что-то пошло не так"
                description="Попробуйте обновить страницу или вернуться позже"
              >
                <div className="error-boundary__actions">
                  <Button variant="primary" onClick={handleRefresh}>
                    Обновить страницу
                  </Button>
                  <Button variant="secondary" onClick={handleGoBack}>
                    Вернуться к списку генераций
                  </Button>
                </div>
              </EmptyState>
            </div>
          </Card>
        </Stack>
      </Container>
    </AppShell>
  )
}

const AppErrorBoundary = AppErrorBoundaryClass

export default AppErrorBoundary

const errorStyles = `
.error-boundary {
  padding: var(--spacing-32);
  text-align: center;
}

.error-boundary__actions {
  display: flex;
  gap: var(--spacing-16);
  justify-content: center;
  margin-top: var(--spacing-24);
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .error-boundary__actions {
    flex-direction: column;
  }
  
  .error-boundary__actions button {
    width: 100%;
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'error-boundary-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = errorStyles
    document.head.appendChild(style)
  }
}

