/**
 * CreateGenerationPage
 * Wizard создания генерации
 * Updated for "juicy" landing page aesthetic
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Container, Stack, Button } from '@/ui'
import clsx from 'clsx'
import GenerationTypeStep from './GenerationTypeStep'
import WorkTypeStep from './WorkTypeStep'
import TaskInputStep from './TaskInputStep'
import TaskModeStep from './TaskModeStep'
import PresentationStyleStep from './PresentationStyleStep'
import GenerationStyleStep from './GenerationStyleStep'
import GenerationGoalStep from './GenerationGoalStep'
import GenerationStructureStep from './GenerationStructureStep'
import GenerationSourcesStep from './GenerationSourcesStep'
import GenerationConfirmStep from './GenerationConfirmStep'
import GenerationFormattingStep from './GenerationFormattingStep'
import GenerationVisualsStep from './GenerationVisualsStep'
import DocUploadStep from './DocUploadStep'
import StepLoader, { StepLoaderTask } from './components/StepLoader'
import type { CreateGenerationForm, GenerationType, WorkType, PresentationStyle, TaskMode, ComplexityLevel } from './types'
import { workTypeConfigs, DEFAULT_GOST_FORMATTING } from './types'
import { motion as motionTokens } from '@/design-tokens'
import { createGeneration, updateGeneration, executeAction, createJob, getGenerationById } from '@/shared/api/generations'
import { suggestDetails, suggestStructure, suggestSources } from '@/shared/api/admin'

type WizardStep = 1 | 1.2 | 1.3 | 1.5 | 1.6 | 1.7 | 1.8 | 2 | 3 | 4 | 5 | 5.5 | 6

function CreateGenerationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStepState] = useState<WizardStep>(1)
  const currentStepRef = useRef<number>(1)
  
  const setCurrentStep = (step: WizardStep) => {
    currentStepRef.current = step
    setCurrentStepState(step)
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  
  // Use ref for activeGenerationId to avoid stale closures in debounced effects
  const activeGenerationRef = useRef<string | null>(null)
  
  const [transitionState, setTransitionState] = useState<{ title: string; tasks: StepLoaderTask[] } | null>(null)
  const [form, setForm] = useState<CreateGenerationForm>({
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
    useAiImages: true,
    useSmartProcessing: true 
  })

  // Load draft if draftId is in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const draftId = params.get('draftId')
    
    if (draftId && !activeGenerationRef.current) {
      getGenerationById(draftId).then((gen) => {
        activeGenerationRef.current = gen.id
        setForm({
          type: gen.module.toLowerCase() as GenerationType,
          workType: (gen.work_type as WorkType) || null,
          presentationStyle: (gen.input_payload.presentation_style as PresentationStyle) || null,
          taskMode: (gen.input_payload.task_mode as TaskMode) || null,
          taskFiles: [], 
          complexityLevel: (gen.complexity_level as ComplexityLevel) || 'student',
          humanityLevel: gen.humanity_level || 50,
          input: gen.input_payload.topic || gen.input_payload.input || '',
          goal: gen.input_payload.goal || '',
          idea: gen.input_payload.idea || '',
          volume: gen.input_payload.volume || 10,
          structure: gen.settings_payload.structure || [],
          sources: gen.settings_payload.sources || [],
          formatting: gen.settings_payload.formatting || DEFAULT_GOST_FORMATTING,
          useAiImages: gen.input_payload.use_ai_images ?? true,
          useSmartProcessing: gen.input_payload.use_smart_processing ?? true
        })
        if (gen.input_payload.current_step) {
          setCurrentStep(gen.input_payload.current_step as WizardStep)
        }
      }).catch(console.error)
    }
  }, [location.search])

  const getStepHeader = (): { title: string; subtitle: string } => {
    if (currentStep === 1) {
      return {
        title: 'С чего начнём?',
        subtitle: 'Выберите формат работы. На следующем шаге мы уточним тему и детали.'
      }
    }

    if (form.type === 'task') {
      if (currentStep === 1.2) return { title: 'Решить задачу', subtitle: 'Загрузите условие задачи, и наши алгоритмы подготовят подробный пошаговый разбор.' }
      if (currentStep === 1.3) return { title: 'Выберите режим решения', subtitle: 'От выбранного режима зависит глубина проработки и формат вывода.' }
      return { title: 'Проверьте детали', subtitle: 'Всё готово к решению задачи. Нажмите "Создать", чтобы начать процесс.' }
    }

    switch (currentStep) {
      case 1.5:
        return {
          title: 'Какую работу создаём?',
          subtitle: 'Укажите тип работы и тему — это поможет нам подобрать правильный стиль и ГОСТ.'
        }
      case 1.6:
        return {
          title: 'Настройка презентации',
          subtitle: 'Выберите стиль оформления и укажите тему выступления.'
        }
      case 1.7:
        return {
          title: 'Настройка стиля и качества',
          subtitle: 'Эти параметры влияют на используемый словарь и защиту от обнаружения ИИ.'
        }
      case 1.8:
        return {
          title: 'Загрузите документ',
          subtitle: 'Мы проверим содержание и приведем его к стандарту ГОСТ.'
        }
      case 2:
        return {
          title: 'Визуальное оформление',
          subtitle: 'Добавьте уникальные иллюстрации, созданные искусственным интеллектом.'
        }
      case 3:
        return {
          title: 'Уточним детали работы',
          subtitle: 'Мы предложили цель и основную идею. Вы можете отредактировать их под свои требования.'
        }
      case 4:
        return {
          title: 'План работы',
          subtitle: 'AI предложил оптимальную структуру. Вы можете добавить, удалить или переименовать разделы.'
        }
      case 5:
        return {
          title: 'Ознакомься с источниками',
          subtitle: 'Мы подобрали актуальные источники. Вы можете добавить свои или отредактировать предложенные.'
        }
      case 5.5:
        return {
          title: 'Настройка оформления',
          subtitle: 'Выберите параметры оформления документа. По умолчанию установлены требования ГОСТ 2026.'
        }
      case 6:
        return {
          title: 'Проверьте детали',
          subtitle: 'Всё готово к созданию черновика. Нажмите "Создать", чтобы начать процесс.'
        }
      default:
        return { title: 'Создать новую работу', subtitle: '' }
    }
  }

  const { title, subtitle } = getStepHeader()

  const isCreatingRef = useRef(false)

  const saveDraft = useCallback(async (currentForm: CreateGenerationForm, stepOverride?: number) => {
    if (!currentForm.type) return

    const draftData = {
      module: currentForm.type.toUpperCase(),
      work_type: currentForm.workType,
      complexity_level: currentForm.complexityLevel,
      humanity_level: currentForm.humanityLevel,
      input_payload: {
        topic: currentForm.input,
        goal: currentForm.goal,
        idea: currentForm.idea,
        volume: currentForm.volume,
        presentation_style: currentForm.presentationStyle,
        task_mode: currentForm.taskMode,
        use_ai_images: currentForm.useAiImages,
        has_files: currentForm.taskFiles.length > 0,
        use_smart_processing: currentForm.useSmartProcessing,
        current_step: stepOverride ?? currentStepRef.current
      },
      settings_payload: {
        structure: currentForm.structure,
        sources: currentForm.sources,
        formatting: currentForm.formatting,
      }
    }

    try {
      if (activeGenerationRef.current) {
        await updateGeneration(activeGenerationRef.current, draftData)
      } else if (!isCreatingRef.current) {
        isCreatingRef.current = true
        try {
          const result = await createGeneration(draftData)
          activeGenerationRef.current = result.id
          // Update URL so refresh loads this draft
          const newParams = new URLSearchParams(window.location.search)
          newParams.set('draftId', result.id)
          const newUrl = `${window.location.pathname}?${newParams.toString()}`
          window.history.replaceState(null, '', newUrl)
        } finally {
          isCreatingRef.current = false
        }
      }
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }, [])

  // Debounced save for any form changes
  useEffect(() => {
    if (!form.type) return

    const timer = setTimeout(() => {
      saveDraft(form)
    }, 2000)

    return () => clearTimeout(timer)
  }, [form, currentStep, saveDraft])

  const handleTypeSelect = (type: GenerationType) => {
    setForm((prev) => {
      const newForm = { ...prev, type }
      saveDraft(newForm)
      return newForm
    })
  }

  const handleWorkTypeSelect = (workType: WorkType) => {
    const config = workTypeConfigs[workType]
    setForm((prev) => {
      const newForm = { 
        ...prev, 
        workType,
        volume: config.defaultVolume
      }
      saveDraft(newForm)
      return newForm
    })
  }

  const handlePresentationStyleSelect = (presentationStyle: PresentationStyle) => {
    setForm((prev) => {
      const newForm = { ...prev, presentationStyle }
      saveDraft(newForm)
      return newForm
    })
  }

  const handleTaskFilesChange = (files: File[]) => {
    setForm((prev) => ({ ...prev, taskFiles: files }))
  }

  const handleTaskModeSelect = (taskMode: TaskMode) => {
    setForm((prev) => ({ ...prev, taskMode }))
  }

  const handleInputChange = (value: string) => {
    setForm((prev) => ({ ...prev, input: value }))
  }

  const startAiAnalysis = () => {
    if (!form.input.trim()) return
    
    setIsSuggesting(true)
    setTransitionState({
      title: 'Анализирую тему',
      tasks: [
        { id: '1', label: 'Изучаю контекст темы...' },
        { id: '2', label: 'Подбираю академический стиль...' },
        { id: '3', label: 'Формулирую научную цель...' },
        { id: '4', label: 'Выделяю главный тезис...' }
      ]
    })
    
    suggestDetails(form.input)
      .then(details => {
        setForm(prev => {
          const newForm = { ...prev, ...details }
          saveDraft(newForm, 3) // Save step index 3
          return newForm
        })
        setTransitionState(null)
        setCurrentStep(3)
      })
      .catch(err => {
        console.error('Failed to suggest details:', err)
        setTransitionState(null)
        setCurrentStep(3) // Переходим на следующий шаг даже при ошибке, пользователь заполнит сам
      })
      .finally(() => setIsSuggesting(false))
  }

  const handleNext = () => {
    let nextStep: WizardStep | null = null

    if (currentStep === 1 && form.type) {
      if (form.type === 'text') nextStep = 1.5
      else if (form.type === 'presentation') nextStep = 1.6
      else if (form.type === 'task') nextStep = 1.2
      else if (form.type === 'gost_format') nextStep = 1.8
    } else if (currentStep === 1.2 && (form.taskFiles.length > 0 || form.input.trim())) {
      nextStep = 1.3
    } else if (currentStep === 1.8 && form.taskFiles.length > 0) {
      nextStep = 5.5
    } else if (currentStep === 1.3 && form.taskMode) {
      nextStep = 6
    } else if (currentStep === 1.5 && form.workType && form.input.trim()) {
      nextStep = 1.7
    } else if (currentStep === 1.6 && form.presentationStyle && form.input.trim()) {
      nextStep = 2
    } else if (currentStep === 1.7) {
      startAiAnalysis()
      return
    } else if (currentStep === 2) {
      startAiAnalysis()
      return
    } else if (currentStep === 3) {
      setTransitionState({
        title: 'Проектирую структуру',
        tasks: [
          { id: '1', label: 'Сверяюсь с требованиями ГОСТ...' },
          { id: '2', label: 'Выстраиваю логику глав...' },
          { id: '3', label: 'Распределяю объем разделов...' },
          { id: '4', label: 'Проверяю связность введения...' }
        ]
      })
      
      suggestStructure({
        topic: form.input,
        goal: form.goal,
        idea: form.idea,
        workType: form.workType || 'other',
        volume: form.volume,
        complexity: form.complexityLevel
      })
        .then(data => {
          setForm(prev => {
            const structureWithIds = data.structure.map((item, idx) => ({
              ...item,
              id: `${idx}-${Date.now()}`
            }))
            const newForm = { ...prev, structure: structureWithIds }
            saveDraft(newForm, 4) // Save next step index
            return newForm
          })
          setTransitionState(null)
          setCurrentStep(4)
        })
        .catch(err => {
          console.error('Failed to suggest structure:', err)
          setTransitionState(null)
          setCurrentStep(4)
        })
      return
    } else if (currentStep === 4) {
      if (form.type === 'presentation') {
        setCurrentStep(6)
        saveDraft(form, 6)
        return
      }
      setTransitionState({
        title: 'Подбираю литературу',
        tasks: [
          { id: '1', label: 'Сканирую научные базы данных...' },
          { id: '2', label: 'Проверяю актуальность публикаций...' },
          { id: '3', label: 'Оформляю список по стандарту...' }
        ]
      })
      
      suggestSources({
        topic: form.input,
        workType: form.workType || 'other',
        volume: form.volume,
        complexity: form.complexityLevel
      })
        .then(data => {
          setForm(prev => {
            const sourcesWithIds = data.sources.map((item, idx) => ({
              ...item,
              id: `${idx}-${Date.now()}`
            }))
            const newForm = { ...prev, sources: sourcesWithIds }
            saveDraft(newForm, 5) // Save next step index
            return newForm
          })
          setTransitionState(null)
          setCurrentStep(5)
        })
        .catch(err => {
          console.error('Failed to suggest sources:', err)
          setTransitionState(null)
          setCurrentStep(5)
        })
      return
    } else if (currentStep === 5) {
      nextStep = 5.5
    } else if (currentStep === 5.5) {
      nextStep = 6
    }

    if (nextStep) {
      setCurrentStep(nextStep)
      saveDraft(form, nextStep)
    }
  }

  const handleBack = () => {
    let prevStep: WizardStep | null = null

    if (currentStep === 1.2 || currentStep === 1.5 || currentStep === 1.6 || currentStep === 1.8) {
      prevStep = 1
    } else if (currentStep === 1.3) {
      prevStep = 1.2
    } else if (currentStep === 1.7) {
      prevStep = 1.5
    } else if (currentStep === 2) {
      prevStep = 1.6
    } else if (currentStep === 3) {
      if (form.type === 'presentation') prevStep = 2
      else if (form.type === 'text') prevStep = 1.7
      else prevStep = 1
    } else if (currentStep === 4) {
      prevStep = 3
    } else if (currentStep === 5) {
      prevStep = 4
    } else if (currentStep === 5.5) {
      prevStep = form.type === 'gost_format' ? 1.8 : 5
    } else if (currentStep === 6) {
      if (form.type === 'task') prevStep = 1.3
      else if (form.type === 'presentation') prevStep = 4
      else prevStep = 5.5
    }

    if (prevStep) {
      setCurrentStep(prevStep)
      saveDraft(form, prevStep)
    }
  }

  const handleConfirm = async () => {
    if (!form.type || !activeGenerationRef.current) return
    
    setIsSubmitting(true)
    try {
      await saveDraft(form)
      await executeAction(activeGenerationRef.current, 'next')
      await createJob(activeGenerationRef.current)
      navigate(`/generations/${activeGenerationRef.current}`)
    } catch (error) {
      console.error('Failed to create generation:', error)
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    if (currentStep === 1) return form.type !== null
    if (currentStep === 1.2) return form.taskFiles.length > 0 || form.input.trim().length > 0
    if (currentStep === 1.8) return form.taskFiles.length > 0
    if (currentStep === 1.3) return form.taskMode !== null
    if (currentStep === 1.5) return form.workType !== null && form.input.trim().length > 0
    if (currentStep === 1.6) return form.presentationStyle !== null && form.input.trim().length > 0
    if (currentStep === 3) return form.goal.trim().length > 0 && form.idea.trim().length > 0
    if (currentStep === 4) return form.structure.length > 0
    if (currentStep === 5) return form.sources.length > 0
    return true
  }

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'create-generation-page-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = pageStyles
    }
  }, [])

  return (
    <Container size="full">
      <Stack align="start" gap="xl" style={{ paddingTop: '32px', paddingBottom: 'var(--spacing-64)', paddingLeft: 'var(--spacing-8)' }}>
        
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          key={`header-${currentStep}`}
          transition={{
            duration: motionTokens.duration.slow,
            ease: motionTokens.easing.out,
          }}
          style={{ width: '100%' }}
        >
          <h1 style={{ 
            marginBottom: 'var(--spacing-8)', 
            color: 'var(--color-neutral-100)', 
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            letterSpacing: '-0.02em',
            textAlign: 'left'
          }}>
            {title}
          </h1>
          <p style={{ 
            fontSize: 'var(--font-size-base)', 
            color: 'var(--color-text-secondary)', 
            lineHeight: 'var(--line-height-relaxed)', 
            marginBottom: 'var(--spacing-40)',
            maxWidth: '100%',
            textAlign: 'left'
          }}>
            {subtitle}
          </p>
        </motion.div>

          <div className="wizard-progress" style={{ marginBottom: 'var(--spacing-40)', width: '100%', justifyContent: 'flex-start' }}>
            {[1, 1.2, 1.3, 1.5, 1.6, 1.7, 1.8, 2, 3, 4, 5, 5.5, 6].map((step) => {
              const shouldShow = (s: number) => {
                if (s === 1.5) return form.type === 'text'
                if (s === 1.6) return form.type === 'presentation'
                if (s === 1.7) return form.type === 'text'
                if (s === 1.8) return form.type === 'gost_format'
                if (s === 2) return form.type === 'presentation'
                if (s === 1.2 || s === 1.3) return form.type === 'task'
                if (s === 3 || s === 4) return form.type === 'text' || form.type === 'presentation'
                if (s === 5) return form.type === 'text'
                if (s === 5.5) return form.type === 'text' || form.type === 'gost_format'
                return true
              }
              if (!shouldShow(step)) return null
              
              const isActive = step === currentStep
              const isCompleted = step < currentStep || (step === 1 && currentStep > 1) || (step === 1.2 && currentStep > 1.2) || (step === 1.3 && currentStep > 1.3) || (step === 1.5 && currentStep > 1.5) || (step === 1.6 && currentStep > 1.6) || (step === 1.7 && currentStep > 1.7) || (step === 2 && currentStep > 2) || (step === 3 && currentStep > 3) || (step === 4 && currentStep > 4) || (step === 5 && currentStep > 5) || (step === 5.5 && currentStep > 5.5)

              return (
                <div key={step} className="wizard-progress__item">
                  <div className={clsx(
                    'wizard-progress__dot',
                    isActive && 'wizard-progress__dot--active',
                    isCompleted && 'wizard-progress__dot--completed'
                  )} />
                  {step < 6 && <div className={clsx(
                    'wizard-progress__line',
                    isCompleted && 'wizard-progress__line--active'
                  )} />}
                </div>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            {transitionState ? (
              <motion.div
                key="step-loader"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%' }}
              >
                <StepLoader title={transitionState.title} tasks={transitionState.tasks} />
              </motion.div>
            ) : (
              <div style={{ width: '100%' }}>
                {currentStep === 1 && <GenerationTypeStep key="step-1" selectedType={form.type} onSelect={handleTypeSelect} />}
                {currentStep === 1.2 && <TaskInputStep key="step-1-2" input={form.input} files={form.taskFiles} onInputChange={handleInputChange} onFilesChange={handleTaskFilesChange} />}
                {currentStep === 1.8 && <DocUploadStep key="step-1-8" files={form.taskFiles} onFilesChange={handleTaskFilesChange} />}
                {currentStep === 1.3 && <TaskModeStep key="step-1-3" selectedMode={form.taskMode} onSelect={handleTaskModeSelect} />}
                {currentStep === 1.5 && form.type && <WorkTypeStep key="step-1-5" type={form.type} selectedWorkType={form.workType} onSelect={handleWorkTypeSelect} input={form.input} onInputChange={handleInputChange} />}
                {currentStep === 1.6 && form.type && <PresentationStyleStep key="step-1-6" type={form.type} selectedStyle={form.presentationStyle} onSelect={handlePresentationStyleSelect} input={form.input} onInputChange={handleInputChange} />}
                {currentStep === 1.7 && <GenerationStyleStep key="step-1-7" complexity={form.complexityLevel} humanity={form.humanityLevel} onChange={(updates) => setForm(prev => ({...prev, ...updates}))} />}
                {currentStep === 2 && <GenerationVisualsStep key="step-2" useAiImages={form.useAiImages} onSelect={(val) => setForm(prev => ({ ...prev, useAiImages: val }))} />}
                {currentStep === 3 && <GenerationGoalStep key="step-3" form={form} isLoading={isSuggesting} onChange={(updates) => setForm(prev => ({ ...prev, ...updates }))} />}
                {currentStep === 4 && <GenerationStructureStep key="step-4" structure={form.structure} onChange={(structure) => setForm(prev => ({ ...prev, structure }))} />}
                {currentStep === 5 && <GenerationSourcesStep key="step-5" sources={form.sources} onChange={(sources) => setForm(prev => ({ ...prev, sources }))} />}
                {currentStep === 5.5 && <GenerationFormattingStep key="step-5-5" formatting={form.formatting} onChange={(formatting) => setForm(prev => ({ ...prev, formatting }))} />}
                {currentStep === 6 && form.type && (
                  <GenerationConfirmStep 
                    key="step-6" 
                    type={form.type} 
                    workType={form.workType}
                    taskMode={form.taskMode}
                    input={form.input} 
                    hasFiles={form.taskFiles.length > 0}
                    useSmartProcessing={form.useSmartProcessing}
                    useAiImages={form.useAiImages}
                    complexityLevel={form.complexityLevel}
                    humanityLevel={form.humanityLevel}
                    volume={form.volume}
                    formatting={form.formatting}
                    onToggleSmartProcessing={(val) => setForm(prev => ({ ...prev, useSmartProcessing: val }))}
                    onConfirm={handleConfirm} 
                    onBack={handleBack} 
                    onJumpToStep={(s) => setCurrentStep(s as WizardStep)}
                    isSubmitting={isSubmitting} 
                  />
                )}
              </div>
            )}
          </AnimatePresence>

          {!transitionState && currentStep < 6 && (
            <div className="wizard-navigation" style={{ marginTop: 'var(--spacing-40)', width: '100%', display: 'flex', justifyContent: 'flex-end', maxWidth: '1800px' }}>
              {currentStep > 1 && <Button variant="secondary" size="lg" onClick={handleBack} disabled={isSubmitting || isSuggesting} style={{ marginRight: '16px' }}>Назад</Button>}
              <Button variant="primary" size="lg" onClick={handleNext} loading={isSuggesting} disabled={!canProceed() || isSubmitting || isSuggesting}>Далее</Button>
            </div>
          )}
        </Stack>
      </Container>
  )
}

export default CreateGenerationPage

const pageStyles = `
.wizard-progress {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  margin-bottom: var(--spacing-64);
}

.wizard-progress__item {
  display: flex;
  align-items: center;
}

.wizard-progress__dot {
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  background-color: var(--color-neutral-30);
  transition: all var(--motion-duration-slow) var(--motion-easing-out);
  border: 2px solid var(--color-background);
  box-shadow: 0 0 0 1px var(--color-neutral-30);
  position: relative;
  z-index: 2;
}

.wizard-progress__dot--active {
  background-color: var(--color-background);
  border-color: var(--color-accent-base);
  box-shadow: 0 0 0 4px var(--color-accent-light);
  transform: scale(1.2);
}

.wizard-progress__dot--completed {
  background-color: var(--color-accent-base);
  box-shadow: 0 0 0 1px var(--color-accent-base);
}

.wizard-progress__line {
  width: 60px;
  height: 2px;
  background-color: var(--color-neutral-30);
  transition: all var(--motion-duration-slow) var(--motion-easing-out);
  margin: 0 -1px;
}

.wizard-progress__line--active {
  background-color: var(--color-accent-base);
}

.wizard-navigation {
  display: flex;
  gap: var(--spacing-16);
}

@media (max-width: 768px) {
  .wizard-progress__line {
    width: 30px;
  }
  
  .wizard-navigation {
    flex-direction: column-reverse;
  }
  
  .wizard-navigation button {
    width: 100%;
  }
}
`
