/**
 * App component
 * Главный компонент приложения с роутингом
 */

import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import GlobalLoading from './layout/GlobalLoading'
import LoginPage from './pages/LoginPage'
import LogoutPage from './pages/LogoutPage'
import ProfilePage from './pages/ProfilePage'
import BillingPage from './pages/BillingPage'
import GenerationsPage from '@/features/generations/GenerationsPage'
import CreateGenerationPage from '@/features/create-generation/CreateGenerationPage'
import GenerationProgressPage from '@/features/generation-progress/GenerationProgressPage'
import GenerationResultPage from '@/features/generation-result/GenerationResultPage'
import GenerationRecoveryPage from '@/features/generation-recovery/GenerationRecoveryPage'
import AccountPage from '@/features/account/AccountPage'

function AppRoutes() {
  const [isLoading] = useState(false)

  return (
    <>
      <GlobalLoading isLoading={isLoading} />
      <Routes>
        <Route path="/" element={<CreateGenerationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/billing" element={<BillingPage />} />
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
  return <AppRoutes />
}

export default App
