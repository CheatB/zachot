/**
 * Zustand store для управления состоянием создания генерации.
 * 
 * Заменяет локальное состояние в CreateGenerationPage и обеспечивает
 * сохранение черновиков между сессиями.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GenerationDraft {
  // Step 1: Тип работы
  workType: 'text' | 'presentation' | 'task'
  module: 'coursework' | 'essay' | 'report' | 'diploma' | 'abstract' | 'presentation' | 'task'
  
  // Step 2: Тема и детали
  topic: string
  goal?: string
  idea?: string
  
  // Step 3: Структура и источники
  structure?: Array<{ title: string; level: number }>
  sources?: Array<{ title: string; url: string; description: string; source_type: string }>
  
  // Step 4: Стиль и качество
  complexity?: number
  humanityLevel?: number
  
  // Step 5: Параметры
  volume?: number
  titleInfo?: {
    university?: string
    faculty?: string
    department?: string
    discipline?: string
    studentName?: string
    groupNumber?: string
    supervisorName?: string
    supervisorTitle?: string
    city?: string
    year?: number
  }
  
  // Мета
  currentStep: number
  lastModified: string
}

interface GenerationState {
  draft: GenerationDraft | null
  
  // Actions
  initDraft: (workType: GenerationDraft['workType'], module: GenerationDraft['module']) => void
  updateDraft: (data: Partial<GenerationDraft>) => void
  clearDraft: () => void
  setStep: (step: number) => void
}

const initialDraft: GenerationDraft = {
  workType: 'text',
  module: 'essay',
  topic: '',
  currentStep: 1,
  lastModified: new Date().toISOString(),
}

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set) => ({
      draft: null,
      
      initDraft: (workType, module) => set({
        draft: {
          ...initialDraft,
          workType,
          module,
          lastModified: new Date().toISOString(),
        }
      }),
      
      updateDraft: (data) => set((state) => ({
        draft: state.draft ? {
          ...state.draft,
          ...data,
          lastModified: new Date().toISOString(),
        } : null
      })),
      
      clearDraft: () => set({ draft: null }),
      
      setStep: (step) => set((state) => ({
        draft: state.draft ? {
          ...state.draft,
          currentStep: step,
          lastModified: new Date().toISOString(),
        } : null
      })),
    }),
    {
      name: 'generation-draft',
      partialize: (state) => ({ draft: state.draft }),
    }
  )
)
