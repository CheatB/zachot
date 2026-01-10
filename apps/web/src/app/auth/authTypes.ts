/**
 * Auth types
 * Типы для системы аутентификации
 */

export interface User {
  id: string // UUID
  role: 'admin' | 'user'
  email?: string
  telegram_username?: string
}

export interface AuthState {
  isAuthenticated: boolean
  isAuthResolved: boolean
  user: User | null
  token: string | null
}

export interface AuthContextValue extends AuthState {
  loginFromLanding: (token: string, userId: string) => void
  logout: () => void
}
