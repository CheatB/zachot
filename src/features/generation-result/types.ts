/**
 * Generation Result types
 * Типы для экрана результата генерации
 */

export type GenerationResultStatus = 'COMPLETED' | 'FAILED'

export interface GenerationResult {
  id: string
  title: string
  type: 'text' | 'presentation' | 'task'
  status: GenerationResultStatus
  completed_at: string // ISO date string
  duration_seconds?: number
  result_content?: string
  error_message?: string
}


