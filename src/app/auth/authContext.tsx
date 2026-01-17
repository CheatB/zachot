/**
 * Auth Context
 * Контекст аутентификации (integration-ready)
 */

/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

import type { AuthContextValue, AuthState } from './authTypes'
import { fetchMe } from '@/shared/api/me'
import { useAuthStore } from '@/shared/store'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = 'zachot_auth_token'
const USER_ID_KEY = 'zachot_auth_user_id'
const REFRESH_TOKEN_KEY = 'zachot_refresh_token'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    return {
      isAuthenticated: false,
      isAuthResolved: false,
      user: null,
      token: null,
    }
  })

  // Helper to load user profile
  const loadProfile = async (token: string) => {
    try {
      const response = await fetchMe()
      const user = { 
        id: response.id, 
        role: response.role,
        email: response.email,
        telegram_username: response.telegram_username,
        subscription: response.subscription ? {
          ...response.subscription,
          status: response.subscription.status || 'none',
        } : undefined,
        usage: response.usage,
      }
      
      // Синхронизируем с Zustand store
      useAuthStore.getState().setAuth(token, {
        id: response.id,
        email: response.email || '',
        name: response.telegram_username,
        role: response.role,
      })
      
      setAuthState({
        isAuthenticated: true,
        isAuthResolved: true,
        user,
        token: token,
      })
    } catch (error) {
      console.error('[AuthProvider] Failed to fetch profile:', error)
      setAuthState((prev) => ({
        ...prev,
        isAuthResolved: true,
      }))
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')
    const userIdFromUrl = params.get('user_id')

    if (tokenFromUrl && userIdFromUrl) {
      localStorage.setItem(TOKEN_KEY, tokenFromUrl)
      localStorage.setItem(USER_ID_KEY, userIdFromUrl)
      window.history.replaceState({}, '', window.location.pathname)
      loadProfile(tokenFromUrl)
      return
    }

    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (storedToken) {
      loadProfile(storedToken)
      return
    }

    setAuthState((prev) => ({
      ...prev,
      isAuthResolved: true,
    }))
  }, [])

  const loginFromLanding = (token: string, userId: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_ID_KEY, userId)
    
    // Временно сохраняем токен в Zustand для немедленного использования
    useAuthStore.getState().setAuth(token, {
      id: userId,
      email: '',
      role: 'user',
    })
    
    setAuthState(prev => ({ ...prev, isAuthResolved: false }))
    loadProfile(token)
    
    // Восстанавливаем URL после входа, если он был сохранён
    const returnUrl = sessionStorage.getItem('zachot_return_url')
    if (returnUrl) {
      sessionStorage.removeItem('zachot_return_url')
      // Небольшая задержка, чтобы профиль успел загрузиться
      setTimeout(() => {
        window.location.href = returnUrl
      }, 500)
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    
    // Синхронизируем с Zustand store
    useAuthStore.getState().logout()

    setAuthState({
      isAuthenticated: false,
      isAuthResolved: true,
      user: null,
      token: null,
    })
  }

  const refreshUser = async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) await loadProfile(token)
  }

  useEffect(() => {
    const handleAuthLogout = () => logout()
    window.addEventListener('auth:logout', handleAuthLogout)
    return () => window.removeEventListener('auth:logout', handleAuthLogout)
  }, [])

  const value: AuthContextValue = {
    ...authState,
    loginFromLanding,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return ctx
}
