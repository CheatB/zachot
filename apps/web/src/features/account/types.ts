/**
 * Account types
 * Типы для страницы аккаунта
 */

export type SubscriptionStatus = 'active' | 'expiring' | 'paused'

export type FairUseMode = 'normal' | 'degraded' | 'strict'

export interface SubscriptionInfo {
  planName: string
  status: SubscriptionStatus
  monthlyPriceRub: number
  nextBillingDate?: string // ISO date string
  expirationDate?: string // ISO date string
}

export interface UsageInfo {
  tokensUsed: number
  tokensLimit: number
  costRub: number
  costLimitRub: number
}

export interface Capabilities {
  streamingAvailable: boolean
  maxTokensPerRequest: number
  priority: 'low' | 'normal' | 'high'
  resultPersistence: boolean
}


