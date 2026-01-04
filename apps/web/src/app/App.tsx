/**
 * App component
 * Главный компонент приложения с роутингом
 */

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './auth/authContext'
import AppErrorBoundary from './errors/AppErrorBoundary'
import GlobalLoading from './layout/GlobalLoading'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import LogoutPage from './pages/LogoutPage'
import GenerationsPage from '@/features/generations/GenerationsPage'
import CreateGenerationPage from '@/features/create-generation/CreateGenerationPage'
import GenerationProgressPage from '@/features/generation-progress/GenerationProgressPage'
import GenerationResultPage from '@/features/generation-result/GenerationResultPage'
import GenerationRecoveryPage from '@/features/generation-recovery/GenerationRecoveryPage'
import AccountPage from '@/features/account/AccountPage'

function AppRoutes() {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Показываем loading только если переход занимает > 300ms
    const timeout = setTimeout(() => {
      setIsLoading(true)
    }, 300)

    return () => {
      clearTimeout(timeout)
      setIsLoading(false)
    }
  }, [location.pathname])

  useEffect(() => {
    // Скрываем loading после завершения перехода
    if (isLoading) {
      const hideTimeout = setTimeout(() => {
        setIsLoading(false)
      }, 100)

      return () => clearTimeout(hideTimeout)
    }
  }, [location.pathname, isLoading])

  return (
    <>
      <GlobalLoading isLoading={isLoading} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/generations" element={<GenerationsPage />} />
        <Route path="/generations/new" element={<CreateGenerationPage />} />
        <Route path="/generations/:id/recovery" element={<GenerationRecoveryPage />} />
        <Route path="/generations/:id/result" element={<GenerationResultPage />} />
        <Route path="/generations/:id" element={<GenerationProgressPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </AppErrorBoundary>
  )
}

export default App
