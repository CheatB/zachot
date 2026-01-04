/**
 * Auth Context
 * Контекст для управления аутентификацией
 * Временный auth bridge из лэндинга
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AuthContextValue, AuthState } from './authTypes'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const SESSION_STORAGE_TOKEN_KEY = 'zachot_auth_token'
const SESSION_STORAGE_USER_ID_KEY = 'zachot_auth_user_id'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  })

  // Инициализация: проверка sessionStorage и URL params
  useEffect(() => {
    // Проверка URL params (приход с лэндинга)
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')
    const userIdFromUrl = urlParams.get('user_id')

    if (tokenFromUrl && userIdFromUrl) {
      // Сохранить в sessionStorage
      sessionStorage.setItem(SESSION_STORAGE_TOKEN_KEY, tokenFromUrl)
      sessionStorage.setItem(SESSION_STORAGE_USER_ID_KEY, userIdFromUrl)

      // Обновить состояние
      setAuthState({
        isAuthenticated: true,
        user: { id: userIdFromUrl },
        token: tokenFromUrl,
      })

      // Очистить query params из URL
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    // Проверка sessionStorage (восстановление сессии)
    const storedToken = sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY)
    const storedUserId = sessionStorage.getItem(SESSION_STORAGE_USER_ID_KEY)

    if (storedToken && storedUserId) {
      setAuthState({
        isAuthenticated: true,
        user: { id: storedUserId },
        token: storedToken,
      })
    }
  }, [])

  const loginFromLanding = (token: string, userId: string) => {
    // Сохранить в sessionStorage
    sessionStorage.setItem(SESSION_STORAGE_TOKEN_KEY, token)
    sessionStorage.setItem(SESSION_STORAGE_USER_ID_KEY, userId)

    // Обновить состояние
    setAuthState({
      isAuthenticated: true,
      user: { id: userId },
      token,
    })
  }

  const logout = () => {
    // Очистить sessionStorage
    sessionStorage.removeItem(SESSION_STORAGE_TOKEN_KEY)
    sessionStorage.removeItem(SESSION_STORAGE_USER_ID_KEY)

    // Обновить состояние
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
    })
  }

  const value: AuthContextValue = {
    ...authState,
    loginFromLanding,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}


