/**
 * Auth Context
 * Контекст аутентификации (integration-ready)
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

import type { AuthContextValue, AuthState } from './authTypes'
import { IS_INTEGRATION } from '@/shared/config'
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
   * 2. sessionStorage
   * 3. integration mode fallback
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')
    const userIdFromUrl = params.get('user_id')

    // 1️⃣ Вход через URL (лендинг / интеграция)
    if (tokenFromUrl && userIdFromUrl) {
      sessionStorage.setItem(TOKEN_KEY, tokenFromUrl)
      sessionStorage.setItem(USER_ID_KEY, userIdFromUrl)

      setAuthState({
        isAuthenticated: true,
        isAuthResolved: true,
        user: { id: userIdFromUrl, role: 'user' }, // По умолчанию user, обновится через /me
        token: tokenFromUrl,
      })

      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    // 2️⃣ Восстановление сессии + проверка через /me
    const storedToken = sessionStorage.getItem(TOKEN_KEY)

    if (storedToken) {
      // Проверяем валидность токена через /me
      fetchMe()
        .then((response) => {
          setAuthState({
            isAuthenticated: true,
            isAuthResolved: true,
            user: { id: response.id, role: response.role },
            token: storedToken,
          })
        })
        .catch(() => {
          // Ошибка /me — auth не прошла
          setAuthState((prev) => ({
            ...prev,
            isAuthResolved: true,
          }))
        })
      return
    }

    // 3️⃣ Integration mode — пускаем внутрь (без backend auth)
    if (IS_INTEGRATION) {
      setAuthState({
        isAuthenticated: true,
        isAuthResolved: true,
        user: { id: 'integration-user', role: 'admin' },
        token: 'integration-token',
      })
      return
    }

    // 4️⃣ Нет токена и не integration mode — создаем анонимную сессию для MVP
    const anonymousId = crypto.randomUUID()
    sessionStorage.setItem(TOKEN_KEY, anonymousId)
    sessionStorage.setItem(USER_ID_KEY, anonymousId)
    
    setAuthState({
      isAuthenticated: true,
      isAuthResolved: true,
      user: { id: anonymousId, role: 'user' },
      token: anonymousId,
    })
  }, [])

  const loginFromLanding = (token: string, userId: string) => {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USER_ID_KEY, userId)

    setAuthState({
      isAuthenticated: true,
      isAuthResolved: true,
      user: { id: userId, role: 'user' },
      token,
    })
  }

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_ID_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)

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
