/**
 * Error Boundary для отлова и обработки ошибок React.
 * 
 * Предотвращает падение всего приложения при ошибках в компонентах.
 */

import { Component, ErrorInfo, ReactNode } from 'react'
import { useUIStore } from '@/shared/store'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // Отправляем уведомление через Zustand
    useUIStore.getState().addToast({
      type: 'error',
      message: 'Произошла ошибка. Пожалуйста, перезагрузите страницу.',
      duration: 0,
    })

    // Здесь можно добавить отправку ошибки в Sentry или другой сервис мониторинга
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#ef4444' }}>
            Что-то пошло не так
          </h1>
          <p style={{ marginBottom: '24px', color: '#6b7280' }}>
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginBottom: '24px', textAlign: 'left', maxWidth: '600px' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '8px', fontWeight: 'bold' }}>
                Подробности ошибки (только в dev режиме)
              </summary>
              <pre
                style={{
                  backgroundColor: '#f3f4f6',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px',
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Перезагрузить страницу
            </button>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
