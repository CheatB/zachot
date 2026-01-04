/**
 * Generation types
 * Типы для генераций
 */

export type GenerationStatus = 'draft' | 'running' | 'completed' | 'failed'

export type GenerationModule = 'text' | 'presentation' | 'tasks'

export interface Generation {
  id: string // UUID
  title: string
  module: GenerationModule
  status: GenerationStatus
  created_at: string // ISO date string
  updated_at: string // ISO date string
}


