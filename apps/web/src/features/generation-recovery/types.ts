/**
 * Generation Recovery types
 * Типы для экрана восстановления генерации
 */

export type RecoveryStatus = 'failed' | 'canceled' | 'unknown'

export interface GenerationRecoveryData {
  id: string
  title: string
  status: RecoveryStatus
  error_hint?: string
}


