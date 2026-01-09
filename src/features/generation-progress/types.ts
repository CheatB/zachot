/**
 * Generation Progress types
 * Типы для экрана процесса генерации
 */

export type ProgressStep = {
  id: string
  label: string
  description?: string
}

export interface GenerationProgressState {
  currentStep: number
  steps: ProgressStep[]
  startedAt: Date
}


