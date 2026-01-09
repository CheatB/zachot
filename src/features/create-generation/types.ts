/**
 * Create Generation types
 * Типы для wizard создания генерации
 */

export type GenerationType = 'text' | 'presentation' | 'task'

// Типы академических работ
export type WorkType = 
  | 'referat' 
  | 'doklad' 
  | 'essay' 
  | 'kursach' 
  | 'article' 
  | 'composition' 
  | 'other'

export type PresentationStyle = 'academic' | 'business' | 'modern' | 'minimalist'

export type TaskMode = 'quick' | 'step-by-step'

export interface WorkTypeConfig {
  id: WorkType
  label: string
  defaultVolume: number // страниц
  minVolume: number
  maxVolume: number
  style: 'academic' | 'creative' | 'formal'
  hasTitlePage: boolean
  hasTableOfContents: boolean
  hasBibliography: boolean
}

export const workTypeConfigs: Record<WorkType, WorkTypeConfig> = {
  referat: {
    id: 'referat',
    label: 'Реферат',
    defaultVolume: 15,
    minVolume: 10,
    maxVolume: 25,
    style: 'academic',
    hasTitlePage: true,
    hasTableOfContents: true,
    hasBibliography: true,
  },
  doklad: {
    id: 'doklad',
    label: 'Доклад',
    defaultVolume: 5,
    minVolume: 3,
    maxVolume: 10,
    style: 'formal',
    hasTitlePage: true,
    hasTableOfContents: false,
    hasBibliography: true,
  },
  essay: {
    id: 'essay',
    label: 'Эссе',
    defaultVolume: 3,
    minVolume: 2,
    maxVolume: 8,
    style: 'creative',
    hasTitlePage: false,
    hasTableOfContents: false,
    hasBibliography: false,
  },
  kursach: {
    id: 'kursach',
    label: 'Курсовая работа',
    defaultVolume: 30,
    minVolume: 25,
    maxVolume: 45,
    style: 'academic',
    hasTitlePage: true,
    hasTableOfContents: true,
    hasBibliography: true,
  },
  article: {
    id: 'article',
    label: 'Научная статья',
    defaultVolume: 8,
    minVolume: 5,
    maxVolume: 15,
    style: 'academic',
    hasTitlePage: false,
    hasTableOfContents: false,
    hasBibliography: true,
  },
  composition: {
    id: 'composition',
    label: 'Сочинение',
    defaultVolume: 4,
    minVolume: 2,
    maxVolume: 10,
    style: 'creative',
    hasTitlePage: false,
    hasTableOfContents: false,
    hasBibliography: false,
  },
  other: {
    id: 'other',
    label: 'Другое',
    defaultVolume: 10,
    minVolume: 1,
    maxVolume: 50,
    style: 'formal',
    hasTitlePage: true,
    hasTableOfContents: true,
    hasBibliography: true,
  },
}

export interface GenerationTypeOption {
  type: GenerationType
  title: string
  description: string
  icon: string
}

export interface StructureItem {
  id: string
  title: string
  level: number
}

export interface SourceItem {
  id: string
  title: string
  url?: string
  description: string
  isAiSelected: boolean
}

export type ComplexityLevel = 'school' | 'student' | 'research'

export interface CreateGenerationForm {
  type: GenerationType | null
  workType: WorkType | null
  presentationStyle: PresentationStyle | null
  taskMode: TaskMode | null
  taskFiles: File[]
  complexityLevel: ComplexityLevel
  humanityLevel: number // 0 to 100
  input: string
  goal: string
  idea: string
  volume: number
  structure: StructureItem[]
  sources: SourceItem[]
  useSmartProcessing: boolean
}

export interface GenerationTypeInfo {
  title: string
  placeholder: string
  hint: string
  helperText: string
}
