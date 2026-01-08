/**
 * Generation Recovery types
 * Типы для экрана восстановления генерации
 */

export type RecoveryStatus = 'FAILED' | 'CANCELED' | 'unknown'

export interface GenerationRecoveryData {
  id: string
  title: string
  status: RecoveryStatus
  error_hint?: string
}


