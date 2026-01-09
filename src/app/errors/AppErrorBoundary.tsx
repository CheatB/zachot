/**
 * AppErrorBoundary component
 * Error Boundary для обработки ошибок приложения
 * UI-only, без технических деталей
 */

import { Component, ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

class AppErrorBoundaryClass extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    console.log('[AppErrorBoundary] Constructor called')
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    console.error('[AppErrorBoundary] Error caught:', error.message, error.stack)
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppErrorBoundary] componentDidCatch:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    console.log('[AppErrorBoundary] Render called, hasError:', this.state.hasError)
    
    if (this.state.hasError) {
      console.log('[AppErrorBoundary] Rendering ErrorFallback')
      return <ErrorFallback />
    }

    console.log('[AppErrorBoundary] Rendering children')
    return this.props.children
  }
}

function ErrorFallback() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-16)', color: 'var(--color-text-primary)' }}>
        Что-то пошло не так
      </h1>
      <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-24)' }}>
        Попробуйте обновить страницу или вернуться позже
      </p>
      <button
        onClick={handleRefresh}
        style={{
          padding: 'var(--spacing-12) var(--spacing-24)',
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-text-inverse)',
          backgroundColor: 'var(--color-accent-base)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'background-color var(--motion-duration-base) ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-accent-base)'
        }}
      >
        Обновить страницу
      </button>
    </div>
  )
}

const AppErrorBoundary = AppErrorBoundaryClass

export default AppErrorBoundary

