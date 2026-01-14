/**
 * Create Generation types
 * Типы для wizard создания генерации
 */

export type GenerationType = 'text' | 'presentation' | 'task' | 'gost_format'

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

export interface FormattingSettings {
  // Основные параметры текста
  fontFamily: 'Times New Roman' | 'Arial' | 'Calibri'
  fontSize: number
  lineSpacing: number
  margins: {
    top: number
    bottom: number
    left: number
    right: number
  }
  alignment: 'justify' | 'left'
  paragraphIndent: number
  
  // Титульный лист
  hasTitlePage: boolean
  titlePageAlignment: 'center' | 'left'
  titlePageFontSize: number
  
  // Содержание
  hasTableOfContents: boolean
  tocFontSize: number
  tocShowPageNumbers: boolean
  tocDotLeader: boolean
  
  // Заголовки
  headings: {
    h1: {
      fontSize: number
      bold: boolean
      uppercase: boolean
      alignment: 'center' | 'left'
      spaceBefore: number
      spaceAfter: number
    }
    h2: {
      fontSize: number
      bold: boolean
      uppercase: boolean
      alignment: 'center' | 'left'
      spaceBefore: number
      spaceAfter: number
    }
    h3: {
      fontSize: number
      bold: boolean
      uppercase: boolean
      alignment: 'center' | 'left'
      spaceBefore: number
      spaceAfter: number
    }
  }
  
  // Список литературы
  bibliographyStyle: 'gost' | 'apa' | 'mla'
  bibliographyFontSize: number
  bibliographyHanging: boolean
  bibliographySpacing: number
  
  // Нумерация страниц
  pageNumbering: 'bottom-center' | 'bottom-right' | 'top-right' | 'none'
  pageNumberingStartFrom: number
  pageNumberingFontSize: number
  
  // Введение и заключение
  introductionElements: {
    hasActuality: boolean
    hasGoal: boolean
    hasTasks: boolean
    hasMethodology: boolean
  }
  conclusionElements: {
    hasResults: boolean
    hasConclusions: boolean
    hasRecommendations: boolean
  }
}

export const DEFAULT_GOST_FORMATTING: FormattingSettings = {
  // Основные параметры текста (ГОСТ 7.32-2017)
  fontFamily: 'Times New Roman',
  fontSize: 14,
  lineSpacing: 1.5,
  margins: {
    top: 20,    // 2 см
    bottom: 20, // 2 см
    left: 30,   // 3 см
    right: 10,  // 1 см
  },
  alignment: 'justify',
  paragraphIndent: 1.25, // 1.25 см
  
  // Титульный лист
  hasTitlePage: true,
  titlePageAlignment: 'center',
  titlePageFontSize: 14,
  
  // Содержание
  hasTableOfContents: true,
  tocFontSize: 14,
  tocShowPageNumbers: true,
  tocDotLeader: true,
  
  // Заголовки (ГОСТ 7.32-2017)
  headings: {
    h1: {
      fontSize: 14,
      bold: true,
      uppercase: true,
      alignment: 'center',
      spaceBefore: 12,
      spaceAfter: 12,
    },
    h2: {
      fontSize: 14,
      bold: true,
      uppercase: false,
      alignment: 'left',
      spaceBefore: 12,
      spaceAfter: 6,
    },
    h3: {
      fontSize: 14,
      bold: true,
      uppercase: false,
      alignment: 'left',
      spaceBefore: 6,
      spaceAfter: 6,
    },
  },
  
  // Список литературы (ГОСТ Р 7.0.5-2008)
  bibliographyStyle: 'gost',
  bibliographyFontSize: 14,
  bibliographyHanging: true,
  bibliographySpacing: 1,
  
  // Нумерация страниц
  pageNumbering: 'bottom-center',
  pageNumberingStartFrom: 3, // Титульник и содержание не нумеруются
  pageNumberingFontSize: 12,
  
  // Введение (обязательные элементы по ГОСТ)
  introductionElements: {
    hasActuality: true,
    hasGoal: true,
    hasTasks: true,
    hasMethodology: true,
  },
  
  // Заключение (обязательные элементы по ГОСТ)
  conclusionElements: {
    hasResults: true,
    hasConclusions: true,
    hasRecommendations: true,
  },
}

export interface TitlePageData {
  universityName: string
  facultyName: string
  departmentName: string
  workType: string
  discipline: string
  theme: string
  studentName: string
  studentGroup: string
  supervisorName: string
  supervisorTitle: string
  city: string
  year: number
}

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
  formatting: FormattingSettings
  titlePage: TitlePageData | null
  useAiImages: boolean
  useSmartProcessing: boolean
}

export interface GenerationTypeInfo {
  title: string
  placeholder: string
  hint: string
  helperText: string
}
