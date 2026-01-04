/**
 * Create Generation types
 * Типы для wizard создания генерации
 */

export type GenerationType = 'text' | 'presentation' | 'task'

export interface GenerationTypeOption {
  type: GenerationType
  title: string
  description: string
  icon: string
}

export interface CreateGenerationForm {
  type: GenerationType | null
  input: string
}

export interface GenerationTypeInfo {
  title: string
  placeholder: string
  hint: string
  helperText: string
}


