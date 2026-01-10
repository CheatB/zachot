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

import type { AuthContextValue, AuthState, User } from './authTypes'
import { fetchMe } from '@/shared/api/me'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = 'zachot_auth_token'
const USER_ID_KEY = 'zachot_auth_user_id'
const REFRESH_TOKEN_KEY = 'zachot_refresh_token'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Пытаемся восстановить базовое состояние из localStorage ПРЯМО ПРИ ИНИЦИАЛИЗАЦИИ
    // Это критично, чтобы AppBoundary не редиректнул на /login во время загрузки
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const storedUserId = localStorage.getItem(USER_ID_KEY)

      if (storedToken && storedUserId) {
        return {
          isAuthenticated: true,
          isAuthResolved: false,
          user: { id: storedUserId, role: 'user' },
          token: storedToken,
        }
      }
    }

    return {
      isAuthenticated: false,
      isAuthResolved: false,
      user: null,
      token: null,
    }
  })

  /**
   * Bootstrap auth:
   * 1. URL params (landing / integration)
   * 2. localStorage verification
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')
    const userIdFromUrl = params.get('user_id')

    // 1️⃣ Вход через URL (лендинг / интеграция)
    if (tokenFromUrl && userIdFromUrl) {
      localStorage.setItem(TOKEN_KEY, tokenFromUrl)
      localStorage.setItem(USER_ID_KEY, userIdFromUrl)

      setAuthState({
        isAuthenticated: true,
        isAuthResolved: true,
        user: { id: userIdFromUrl, role: 'user' },
        token: tokenFromUrl,
      })

      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    // 2️⃣ Верификация существующей сессии через /me
    const storedToken = localStorage.getItem(TOKEN_KEY)

    if (storedToken) {
      fetchMe()
        .then((response) => {
          setAuthState({
            isAuthenticated: true,
            isAuthResolved: true,
            user: { 
              id: response.id, 
              role: response.role,
              email: response.email,
              telegram_username: response.telegram_username
            },
            token: storedToken,
          })
        })
        .catch((error) => {
          // Если это 401, значит токен невалиден
          if (error.status === 401) {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_ID_KEY)
            setAuthState({
              isAuthenticated: false,
              isAuthResolved: true,
              user: null,
              token: null,
            })
          } else {
            // Ошибка сети или сервера — сохраняем isAuthenticated: true, 
            // чтобы не выкидывать пользователя, но помечаем resolved
            setAuthState((prev) => ({
              ...prev,
              isAuthResolved: true,
            }))
          }
        })
      return
    }

    // 3️⃣ Нет токена — оставляем как есть (unauthenticated)
    setAuthState((prev) => ({
      ...prev,
      isAuthResolved: true,
    }))
  }, [])

  const loginFromLanding = (token: string, userId: string, details?: Partial<User>) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_ID_KEY, userId)

    setAuthState({
      isAuthenticated: true,
      isAuthResolved: true,
      user: { id: userId, role: 'user', ...details },
      token,
    })
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)

    setAuthState({
      isAuthenticated: false,
      isAuthResolved: true,
      user: null,
      token: null,
    })
  }

  // Подписка на событие logout из API слоя
  useEffect(() => {
    const handleAuthLogout = () => {
      setAuthState({
        isAuthenticated: false,
        isAuthResolved: true,
        user: null,
        token: null,
      })
    }

    window.addEventListener('auth:logout', handleAuthLogout)
    return () => window.removeEventListener('auth:logout', handleAuthLogout)
  }, [])

  const value: AuthContextValue = {
    ...authState,
    loginFromLanding,
    logout,
  }

  // Логирование для отладки
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[AuthProvider] Rendering with context:', {
        isAuthenticated: authState.isAuthenticated,
        isAuthResolved: authState.isAuthResolved,
        hasUser: !!authState.user,
        timestamp: new Date().toISOString(),
      })
    }
  }, [authState.isAuthenticated, authState.isAuthResolved, authState.user])

  console.log('[AuthProvider] Rendering Provider with value:', {
    isAuthenticated: value.isAuthenticated,
    isAuthResolved: value.isAuthResolved,
    hasUser: !!value.user,
  })
  
  console.log('[AuthProvider] About to render AuthContext.Provider...')

  try {
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    )
  } catch (error) {
    console.error('[AuthProvider] Error rendering Provider:', error)
    throw error
  }
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return ctx
}
