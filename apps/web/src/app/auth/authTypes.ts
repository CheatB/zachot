/**
 * Auth types
 * Типы для системы аутентификации
 */

export interface Subscription {
  planName: string
  status: 'active' | 'expiring' | 'paused' | 'canceled' | 'none'
  monthlyPriceRub: number
  nextBillingDate?: string
  expiresAt?: string
  autoRenew?: boolean
  period?: 'month' | 'quarter' | 'year'
}

export interface Usage {
  generationsUsed: number
  generationsLimit: number
  tokensUsed: number
  tokensLimit: number
}

export interface User {
  id: string // UUID
  role: 'admin' | 'user'
  email?: string
  telegram_username?: string
  subscription?: Subscription
  usage?: Usage
}

export interface AuthState {
  isAuthenticated: boolean
  isAuthResolved: boolean
  user: User | null
  token: string | null
}

export interface AuthContextValue extends AuthState {
  loginFromLanding: (token: string, userId: string, role?: string) => void
  logout: () => void
  refreshUser: () => Promise<void>
}
