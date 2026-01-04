/**
 * Auth types
 * Типы для системы аутентификации
 */

export interface User {
  id: string // UUID
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

export interface AuthContextValue extends AuthState {
  loginFromLanding: (token: string, userId: string) => void
  logout: () => void
}


