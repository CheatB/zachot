import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CreateGenerationForm } from '../types'
import { DEFAULT_GOST_FORMATTING } from '../types'

interface CreateState {
  currentStep: number
  form: CreateGenerationForm
  activeGenerationId: string | null
  
  // Actions
  setStep: (step: number) => void
  setForm: (updates: Partial<CreateGenerationForm>) => void
  resetForm: () => void
  setActiveGenerationId: (id: string | null) => void
}

const initialForm: CreateGenerationForm = {
  type: null,
  workType: null,
  presentationStyle: null,
  taskMode: null,
  taskFiles: [],
  complexityLevel: 'student',
  humanityLevel: 50,
  input: '',
  goal: 'Провести комплексное исследование по заданной теме',
  idea: 'Основная идея работы заключается в глубоком анализе существующих материалов и формулировании авторских выводов.',
  volume: 10,
  structure: [],
  sources: [],
  formatting: DEFAULT_GOST_FORMATTING,
  useSmartProcessing: true 
}

export const useCreateStore = create<CreateState>()(
  persist(
    (set) => ({
      currentStep: 1,
      form: initialForm,
      activeGenerationId: null,

      setStep: (step: number) => set({ currentStep: step }),
      setForm: (updates: Partial<CreateGenerationForm>) => set((state: CreateState) => ({ 
        form: { ...state.form, ...updates } 
      })),
      resetForm: () => set({ form: initialForm, currentStep: 1, activeGenerationId: null }),
      setActiveGenerationId: (id: string | null) => set({ activeGenerationId: id }),
    }),
    {
      name: 'zachet-create-wizard',
      partialize: (state: CreateState) => ({ 
        currentStep: state.currentStep,
        form: { ...state.form, taskFiles: [] }, // Don't persist files
        activeGenerationId: state.activeGenerationId 
      }),
    }
  )
)
