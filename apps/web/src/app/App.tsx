/**
 * App component
 * Главный компонент приложения с роутингом и провайдерами
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
import { AuthProvider, useAuthContext } from './auth/authContext'
import AppBoundary from './AppBoundary'

// Admin features
import AdminLayout from '@/features/admin/components/AdminLayout'
import ModelRoutingPage from '@/features/admin/pages/ModelRoutingPage'
import AdminUsersPage from '@/features/admin/pages/AdminUsersPage'
import AdminAnalyticsPage from '@/features/admin/pages/AdminAnalyticsPage'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user'
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuthContext()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

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
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/models" replace />} />
          <Route path="models" element={<ModelRoutingPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
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
