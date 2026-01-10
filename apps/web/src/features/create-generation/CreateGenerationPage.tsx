/**
 * CreateGenerationPage
 * Wizard создания генерации
 * Refactored to use Zustand for state management
 */

import { useEffect, useCallback, useRef } from 'react'
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
import StepLoader, { StepLoaderTask } from './components/StepLoader'
import type { GenerationType, WorkType, PresentationStyle, TaskMode, ComplexityLevel } from './types'
import { workTypeConfigs } from './types'
import { motion as motionTokens } from '@/design-tokens'
import { createGeneration, updateGeneration, executeAction, createJob, getGenerationById } from '@/shared/api/generations'
import { suggestDetails, suggestStructure, suggestSources } from '@/shared/api/admin'
import { useCreateStore } from './store/useCreateStore'
import { useState } from 'react'

function CreateGenerationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Use Zustand store
  const { 
    currentStep, 
    form, 
    activeGenerationId, 
    setStep, 
    setForm, 
    setActiveGenerationId,
    resetForm 
  } = useCreateStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [transitionState, setTransitionState] = useState<{ title: string; tasks: StepLoaderTask[] } | null>(null)
  
  const isCreatingRef = useRef(false)

  // Load draft if draftId is in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const draftId = params.get('draftId')
    
    if (draftId && draftId !== activeGenerationId) {
      getGenerationById(draftId).then((gen) => {
        setActiveGenerationId(gen.id)
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
          useSmartProcessing: gen.input_payload.use_smart_processing ?? true
        })
        if (gen.input_payload.current_step) {
          setStep(gen.input_payload.current_step as number)
        }
      }).catch(console.error)
    }
  }, [location.search, activeGenerationId, setActiveGenerationId, setForm, setStep])

  const saveDraft = useCallback(async (stepOverride?: number) => {
    if (!form.type) return

    const draftData = {
      module: form.type.toUpperCase(),
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
        has_files: form.taskFiles.length > 0,
        use_smart_processing: form.useSmartProcessing,
        current_step: stepOverride ?? currentStep
      },
      settings_payload: {
        structure: form.structure,
        sources: form.sources,
      }
    }

    try {
      if (activeGenerationId) {
        await updateGeneration(activeGenerationId, draftData)
      } else if (!isCreatingRef.current) {
        isCreatingRef.current = true
        try {
          const result = await createGeneration(draftData)
          setActiveGenerationId(result.id)
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
  }, [form, currentStep, activeGenerationId, setActiveGenerationId])

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
      case 3:
        return {
          title: 'Формулируем цель и идею работы',
          subtitle: 'Мы предложили цель и основную идею. Вы можете отредактировать их под свои требования.'
        }
      case 4:
        return {
          title: 'План работы',
          subtitle: 'Система предложила оптимальную структуру. Вы можете добавить, удалить или переименовать разделы.'
        }
      case 5:
        return {
          title: 'Источники информации',
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

  const startAiAnalysis = (force = false) => {
    if (!form.input.trim()) return
    // Only suggest if not already present OR if forced
    if (!force && form.goal && form.idea && form.goal !== 'Провести комплексное исследование по заданной теме') {
      setStep(3)
      return
    }
    
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
        setForm(details)
        saveDraft(3)
        setTransitionState(null)
        setStep(3)
      })
      .finally(() => setIsSuggesting(false))
  }

  const suggestStructureData = (force = false) => {
    if (!force && form.structure.length > 0) {
      setStep(4)
      return
    }

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
        const structureWithIds = data.structure.map((item, idx) => ({
          ...item,
          id: `${idx}-${Date.now()}`
        }))
        setForm({ structure: structureWithIds })
        saveDraft(4)
        setTransitionState(null)
        setStep(4)
      })
      .catch(err => {
        console.error('Failed to suggest structure:', err)
        setTransitionState(null)
        setStep(4)
      })
  }

  const suggestSourcesData = (force = false) => {
    if (!force && form.sources.length > 0) {
      setStep(5)
      return
    }

    setTransitionState({
      title: 'Подбираю информацию',
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
        const sourcesWithIds = data.sources.map((item, idx) => ({
          ...item,
          id: `${idx}-${Date.now()}`
        }))
        setForm({ sources: sourcesWithIds })
        saveDraft(5)
        setTransitionState(null)
        setStep(5)
      })
      .catch(err => {
        console.error('Failed to suggest sources:', err)
        setTransitionState(null)
        setStep(5)
      })
  }

  const handleNext = () => {
    let nextStep: number | null = null

    if (currentStep === 1 && form.type) {
      if (form.type === 'text') nextStep = 1.5
      else if (form.type === 'presentation') nextStep = 1.6
      else if (form.type === 'task') nextStep = 1.2
    } else if (currentStep === 1.2 && (form.taskFiles.length > 0 || form.input.trim())) {
      nextStep = 1.3
    } else if (currentStep === 1.3 && form.taskMode) {
      nextStep = 6
    } else if (currentStep === 1.5 && form.workType && form.input.trim()) {
      nextStep = 1.7
    } else if (currentStep === 1.6 && form.presentationStyle && form.input.trim()) {
      startAiAnalysis()
      return
    } else if (currentStep === 1.7) {
      startAiAnalysis()
      return
    } else if (currentStep === 3) {
      suggestStructureData()
      return
    } else if (currentStep === 4) {
      suggestSourcesData()
      return
    } else if (currentStep === 5) {
      nextStep = 6
    }

    if (nextStep) {
      setStep(nextStep)
      saveDraft(nextStep)
    }
  }

  const handleBack = () => {
    let prevStep: number | null = null

    if (currentStep === 1.2 || currentStep === 1.5 || currentStep === 1.6) {
      prevStep = 1
    } else if (currentStep === 1.3) {
      prevStep = 1.2
    } else if (currentStep === 1.7) {
      prevStep = 1.5
    } else if (currentStep === 3) {
      if (form.type === 'presentation') prevStep = 1.6
      else if (form.type === 'text') prevStep = 1.7
      else prevStep = 1
    } else if (currentStep === 4) {
      prevStep = 3
    } else if (currentStep === 5) {
      prevStep = 4
    } else if (currentStep === 6) {
      if (form.type === 'task') prevStep = 1.3
      else prevStep = 5
    }

    if (prevStep) {
      setStep(prevStep)
      saveDraft(prevStep)
    }
  }

  const handleConfirm = async () => {
    if (!form.type || !activeGenerationId) return
    
    setIsSubmitting(true)
    try {
      await saveDraft()
      await executeAction(activeGenerationId, 'next')
      await createJob(activeGenerationId)
      const finalId = activeGenerationId
      resetForm() // Clear state after success
      navigate(`/generations/${finalId}`)
    } catch (error) {
      console.error('Failed to create generation:', error)
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    if (currentStep === 1) return form.type !== null
    if (currentStep === 1.2) return form.taskFiles.length > 0 || form.input.trim().length > 0
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
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
            </div>
            
            {/* Кнопка "Перегенерировать" для соответствующих шагов */}
            {[3, 4, 5].includes(currentStep) && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  if (currentStep === 3) startAiAnalysis(true)
                  else if (currentStep === 4) suggestStructureData(true)
                  else if (currentStep === 5) suggestSourcesData(true)
                }}
                disabled={isSuggesting}
                style={{ borderRadius: '12px', padding: '0 20px' }}
              >
                🪄 Перегенерировать
              </Button>
            )}
          </div>
        </motion.div>

          <div className="wizard-progress" style={{ marginBottom: 'var(--spacing-40)', width: '100%', justifyContent: 'flex-start' }}>
            {[1, 1.2, 1.3, 1.5, 1.6, 1.7, 3, 4, 5, 6].map((step) => {
              const shouldShow = (s: number) => {
                if (s === 1.5 || s === 1.7) return form.type === 'text'
                if (s === 1.6) return form.type === 'presentation'
                if (s === 1.2 || s === 1.3) return form.type === 'task'
                if (s === 3 || s === 4 || s === 5) return form.type !== 'task'
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
                {currentStep === 1 && <GenerationTypeStep key="step-1" selectedType={form.type} onSelect={(type) => setForm({ type })} />}
                {currentStep === 1.2 && <TaskInputStep key="step-1-2" input={form.input} files={form.taskFiles} onInputChange={(v) => setForm({ input: v })} onFilesChange={(f) => setForm({ taskFiles: f })} />}
                {currentStep === 1.3 && <TaskModeStep key="step-1-3" selectedMode={form.taskMode} onSelect={(m) => setForm({ taskMode: m })} />}
                {currentStep === 1.5 && form.type && (
                  <WorkTypeStep 
                    key="step-1-5" 
                    type={form.type} 
                    selectedWorkType={form.workType} 
                    onSelect={(wt) => {
                      const config = workTypeConfigs[wt]
                      setForm({ workType: wt, volume: config.defaultVolume })
                    }} 
                    input={form.input} 
                    onInputChange={(v) => setForm({ input: v })} 
                  />
                )}
                {currentStep === 1.6 && form.type && (
                  <PresentationStyleStep 
                    key="step-1-6" 
                    type={form.type} 
                    selectedStyle={form.presentationStyle} 
                    onSelect={(s) => setForm({ presentationStyle: s })} 
                    input={form.input} 
                    onInputChange={(v) => setForm({ input: v })} 
                  />
                )}
                {currentStep === 1.7 && <GenerationStyleStep key="step-1-7" complexity={form.complexityLevel} humanity={form.humanityLevel} onChange={(updates) => setForm(updates)} />}
                {currentStep === 3 && <GenerationGoalStep key="step-3" form={form} isLoading={isSuggesting} onChange={(updates) => setForm(updates)} />}
                {currentStep === 4 && <GenerationStructureStep key="step-4" structure={form.structure} onChange={(structure) => setForm({ structure })} />}
                {currentStep === 5 && <GenerationSourcesStep key="step-5" sources={form.sources} onChange={(sources) => setForm({ sources })} />}
                {currentStep === 6 && form.type && (
                  <GenerationConfirmStep 
                    key="step-6" 
                    type={form.type} 
                    workType={form.workType}
                    taskMode={form.taskMode}
                    input={form.input} 
                    hasFiles={form.taskFiles.length > 0}
                    useSmartProcessing={form.useSmartProcessing}
                    complexityLevel={form.complexityLevel}
                    humanityLevel={form.humanityLevel}
                    volume={form.volume}
                    onToggleSmartProcessing={(val) => setForm({ useSmartProcessing: val })}
                    onConfirm={handleConfirm} 
                    onBack={handleBack} 
                    onJumpToStep={(s) => setStep(s)}
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
