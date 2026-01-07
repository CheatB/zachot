/**
 * App component
 * Главный компонент приложения с роутингом
 */

import { useState } from 'react'
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'
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
import { ToastProvider } from '@/ui/primitives/Toast'
import { AuthProvider } from './auth/authContext'
import AppBoundary from './AppBoundary'

// Admin features
import AdminPage from '@/features/admin/AdminPage'
import ModelRoutingPage from '@/features/admin/ModelRoutingPage'
import UsersPage from '@/features/admin/UsersPage'
import AnalyticsPage from '@/features/admin/AnalyticsPage'

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
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<Navigate to="/admin/models" replace />} />
          <Route path="models" element={<ModelRoutingPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppBoundary>
            <AppRoutes />
          </AppBoundary>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
