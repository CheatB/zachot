/**
 * CreateGenerationPage
 * Wizard создания генерации
 * Updated for "juicy" landing page aesthetic
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Container, Stack, Button } from '@/ui'
import clsx from 'clsx'
import GenerationTypeStep from './GenerationTypeStep'
import WorkTypeStep from './WorkTypeStep'
import TaskInputStep from './TaskInputStep'
import TaskModeStep from './TaskModeStep'
import PresentationStyleStep from './PresentationStyleStep'
import GenerationStyleStep from './GenerationStyleStep'
import GenerationInputStep from './GenerationInputStep'
import GenerationGoalStep from './GenerationGoalStep'
import GenerationStructureStep from './GenerationStructureStep'
import GenerationSourcesStep from './GenerationSourcesStep'
import GenerationConfirmStep from './GenerationConfirmStep'
import StepLoader, { StepLoaderTask } from './components/StepLoader'
import type { CreateGenerationForm, GenerationType, WorkType, PresentationStyle, TaskMode } from './types'
import { workTypeConfigs } from './types'
import { motion as motionTokens } from '@/design-tokens'
import { createGeneration, executeAction, createJob } from '@/shared/api/generations'
import { suggestDetails } from '@/shared/api/admin'

type WizardStep = 1 | 1.2 | 1.3 | 1.5 | 1.6 | 1.7 | 2 | 3 | 4 | 5 | 6

function CreateGenerationPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
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
    useSmartProcessing: true // Новый флаг
  })

  const getStepHeader = (): { title: string; subtitle: string } => {
    if (currentStep === 1) {
      return {
        title: 'Создать новую работу',
        subtitle: 'Мы поможем подготовить качественную работу по всем академическим нормам'
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
          subtitle: 'От типа работы зависят настройки оформления по ГОСТу и стиль генерации текста.'
        }
      case 1.6:
        return {
          title: 'Выберите стиль презентации',
          subtitle: 'Стиль влияет на визуальное оформление и структуру слайдов.'
        }
      case 1.7:
        return {
          title: 'Настройка стиля и качества',
          subtitle: 'Эти параметры влияют на используемый словарь и защиту от обнаружения ИИ.'
        }
      case 2:
        return {
          title: 'О чем будет работа?',
          subtitle: 'Чем подробнее описание, тем точнее будет черновик'
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
          title: 'Источники литературы',
          subtitle: 'Мы подобрали актуальные источники. Вы можете добавить свои или отредактировать предложенные.'
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

  const handleTypeSelect = (type: GenerationType) => {
    setForm((prev) => ({ ...prev, type }))
  }

  const handleWorkTypeSelect = (workType: WorkType) => {
    const config = workTypeConfigs[workType]
    setForm((prev) => ({ 
      ...prev, 
      workType,
      volume: config.defaultVolume
    }))
  }

  const handlePresentationStyleSelect = (presentationStyle: PresentationStyle) => {
    setForm((prev) => ({ ...prev, presentationStyle }))
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

  const handleNext = () => {
    if (currentStep === 1 && form.type) {
      if (form.type === 'text') setCurrentStep(1.5)
      else if (form.type === 'presentation') setCurrentStep(1.6)
      else if (form.type === 'task') setCurrentStep(1.2)
    } else if (currentStep === 1.2 && (form.taskFiles.length > 0 || form.input.trim())) {
      setCurrentStep(1.3)
    } else if (currentStep === 1.3 && form.taskMode) {
      setCurrentStep(6)
    } else if (currentStep === 1.5 && form.workType) {
      setCurrentStep(1.7)
    } else if (currentStep === 1.6 && form.presentationStyle) {
      setCurrentStep(2)
    } else if (currentStep === 1.7) {
      setCurrentStep(2)
    } else if (currentStep === 2 && form.input.trim()) {
      // Предлагаем детали через AI при переходе с темы на цель/идею
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
          setForm(prev => ({ ...prev, ...details }))
          setTransitionState(null)
          setCurrentStep(3)
        })
        .finally(() => setIsSuggesting(false))
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
      setTimeout(() => {
        setTransitionState(null)
        setCurrentStep(4)
      }, 3000)
    } else if (currentStep === 4) {
      setTransitionState({
        title: 'Подбираю литературу',
        tasks: [
          { id: '1', label: 'Сканирую научные базы данных...' },
          { id: '2', label: 'Проверяю актуальность публикаций...' },
          { id: '3', label: 'Оформляю список по стандарту...' }
        ]
      })
      setTimeout(() => {
        setTransitionState(null)
        setCurrentStep(5)
      }, 3000)
    } else if (currentStep === 5) {
      setCurrentStep(6)
    }
  }

  const handleBack = () => {
    if (currentStep === 1.2 || currentStep === 1.5 || currentStep === 1.6) {
      setCurrentStep(1)
    } else if (currentStep === 1.3) {
      setCurrentStep(1.2)
    } else if (currentStep === 1.7) {
      setCurrentStep(1.5)
    } else if (currentStep === 2) {
      if (form.type === 'text') setCurrentStep(1.7)
      else if (form.type === 'presentation') setCurrentStep(1.6)
      else if (form.type === 'task') setCurrentStep(1.3)
      else setCurrentStep(1)
    } else if (currentStep === 3) {
      setCurrentStep(2)
    } else if (currentStep === 4) {
      setCurrentStep(3)
    } else if (currentStep === 5) {
      setCurrentStep(4)
    } else if (currentStep === 6) {
      if (form.type === 'task') setCurrentStep(1.3)
      else setCurrentStep(5)
    }
  }

  const handleConfirm = async () => {
    if (!form.type) return
    
    setIsSubmitting(true)
    try {
      // 1. Создаем Generation (статус DRAFT)
      const result = await createGeneration({
        type: form.type.toUpperCase(),
        work_type: form.workType,
        complexity_level: form.complexityLevel,
        humanity_level: form.humanityLevel,
        input_payload: {
          topic: form.input,
          goal: form.goal,
          idea: form.idea,
          volume: form.volume,
          presentation_style: form.presentationStyle,
          task_mode: form.taskMode,
          has_files: form.taskFiles.length > 0
        },
        settings_payload: {
          structure: form.structure,
          sources: form.sources,
        }
      })

      // 2. Переводим в статус RUNNING
      await executeAction(result.id, 'next')

      // 3. Запускаем фоновую задачу (Worker)
      await createJob(result.id)

      navigate(`/generations/${result.id}`)
    } catch (error) {
      console.error('Failed to create generation:', error)
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    if (currentStep === 1) return form.type !== null
    if (currentStep === 1.2) return form.taskFiles.length > 0 || form.input.trim().length > 0
    if (currentStep === 1.3) return form.taskMode !== null
    if (currentStep === 1.5) return form.workType !== null
    if (currentStep === 1.6) return form.presentationStyle !== null
    if (currentStep === 2) return form.input.trim().length > 0
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
            fontSize: 'var(--font-size-sm)', 
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
            {[1, 1.2, 1.3, 1.5, 1.6, 1.7, 2, 3, 4, 5, 6].map((step) => {
              const shouldShow = (s: number) => {
                if (s === 1.5 || s === 1.7) return form.type === 'text'
                if (s === 1.6) return form.type === 'presentation'
                if (s === 1.2 || s === 1.3) return form.type === 'task'
                if (s === 2 || s === 3 || s === 4 || s === 5) return form.type !== 'task'
                return true
              }
              if (!shouldShow(step)) return null
              
              const isActive = step === currentStep
              const isCompleted = step < currentStep || (step === 1 && currentStep > 1) || (step === 1.2 && currentStep > 1.2) || (step === 1.3 && currentStep > 1.3) || (step === 1.5 && currentStep > 1.5) || (step === 1.6 && currentStep > 1.6) || (step === 1.7 && currentStep > 1.7) || (step === 2 && currentStep > 2) || (step === 3 && currentStep > 3) || (step === 4 && currentStep > 4) || (step === 5 && currentStep > 5)

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
                {currentStep === 1.3 && <TaskModeStep key="step-1-3" selectedMode={form.taskMode} onSelect={handleTaskModeSelect} />}
                {currentStep === 1.5 && <WorkTypeStep key="step-1-5" selectedWorkType={form.workType} onSelect={handleWorkTypeSelect} />}
                {currentStep === 1.6 && <PresentationStyleStep key="step-1-6" selectedStyle={form.presentationStyle} onSelect={handlePresentationStyleSelect} />}
                {currentStep === 1.7 && <GenerationStyleStep key="step-1-7" complexity={form.complexityLevel} humanity={form.humanityLevel} onChange={(updates) => setForm(prev => ({...prev, ...updates}))} />}
                {currentStep === 2 && form.type && <GenerationInputStep key="step-2" type={form.type} input={form.input} onInputChange={handleInputChange} />}
                {currentStep === 3 && <GenerationGoalStep key="step-3" form={form} isLoading={isSuggesting} onChange={(updates) => setForm(prev => ({ ...prev, ...updates }))} />}
                {currentStep === 4 && <GenerationStructureStep key="step-4" structure={form.structure} onChange={(structure) => setForm(prev => ({ ...prev, structure }))} />}
                {currentStep === 5 && <GenerationSourcesStep key="step-5" sources={form.sources} onChange={(sources) => setForm(prev => ({ ...prev, sources }))} />}
                {currentStep === 6 && form.type && (
                  <GenerationConfirmStep 
                    key="step-6" 
                    type={form.type} 
                    workType={form.workType}
                    taskMode={form.taskMode}
                    input={form.input} 
                    hasFiles={form.taskFiles.length > 0}
                    useSmartProcessing={form.useSmartProcessing}
                    onToggleSmartProcessing={(val) => setForm(prev => ({ ...prev, useSmartProcessing: val }))}
                    onConfirm={handleConfirm} 
                    onBack={handleBack} 
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
