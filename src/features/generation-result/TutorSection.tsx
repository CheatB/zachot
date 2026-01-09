/**
 * TutorSection
 * Интерактивный разбор задачи по шагам
 */

import { useState, Fragment, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Button, Stack, Badge, Formula } from '@/ui'
import { getGenerationById } from '@/shared/api/generations'

interface Choice {
  id: string
  text: string
  isCorrect: boolean
  explanation: string
}

interface Step {
  id: number
  title: string
  content: string
  choices: Choice[]
}

interface TutorSectionProps {
  generationId: string
}

function TutorSection({ generationId }: TutorSectionProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadResult = async () => {
      try {
        const data = await getGenerationById(generationId)
        if (data.result_content) {
          // Если контент — это JSON (структурированный разбор), парсим его
          // Иначе пытаемся создать один шаг из текста
          try {
            const parsed = JSON.parse(data.result_content)
            if (Array.isArray(parsed.steps)) {
              setSteps(parsed.steps)
            } else {
              throw new Error('Not a structured tutor result')
            }
          } catch {
            // Фолбэк: превращаем обычный текст в один интерактивный шаг
            setSteps([{
              id: 1,
              title: 'Разбор решения',
              content: data.result_content,
              choices: [
                { id: 'ok', text: 'Понятно, спасибо!', isCorrect: true, explanation: 'Отлично, двигаемся дальше!' }
              ]
            }])
          }
        }
      } catch (error) {
        console.error('Failed to load tutor steps:', error)
      } finally {
        setLoading(false)
      }
    }
    loadResult()
  }, [generationId])

  if (loading) return <div>Загрузка разбора...</div>
  if (steps.length === 0) return <div>Разбор скоро появится</div>

  const renderTextWithFormulas = (text: string) => {
    // Поддержка и $...$ и $$...$$
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g)
    return parts.map((part, i) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return <Formula key={i} tex={part.slice(2, -2)} block />
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        return <Formula key={i} tex={part.slice(1, -1)} />
      }
      return <Fragment key={i}>{part}</Fragment>
    })
  }

  const handleChoice = (choiceId: string) => {
    setSelectedChoiceId(choiceId)
    setIsAnswered(true)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      setSelectedChoiceId(null)
      setIsAnswered(false)
    }
  }

  const step = steps[currentStep]
  const selectedChoice = step.choices.find(c => c.id === selectedChoiceId)

  return (
    <div className="tutor-section">
      <Stack gap="xl">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card style={{ padding: 'var(--spacing-24)', borderLeft: '4px solid var(--color-accent-base)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-12)' }}>{step.title}</h3>
            <div style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-24)', color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>
              {renderTextWithFormulas(step.content)}
            </div>

            <div className="choices-grid" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
              {step.choices.map((choice) => {
                const isSelected = selectedChoiceId === choice.id
                let state: 'neutral' | 'success' | 'danger' = 'neutral'
                if (isAnswered) {
                  if (choice.isCorrect) state = 'success'
                  else if (isSelected) state = 'danger'
                }

                return (
                  <button
                    key={choice.id}
                    disabled={isAnswered}
                    onClick={() => handleChoice(choice.id)}
                    style={{
                      textAlign: 'left',
                      padding: 'var(--spacing-16)',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid',
                      borderColor: isSelected ? 'var(--color-accent-base)' : 'var(--color-border-base)',
                      backgroundColor: state === 'success' ? 'var(--color-success-light)' : 
                                       state === 'danger' ? 'var(--color-danger-light)' : 
                                       isSelected ? 'var(--color-accent-light)' : 'var(--color-surface-base)',
                      cursor: isAnswered ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: isSelected ? 'bold' : 'normal' }}>
                        {renderTextWithFormulas(choice.text)}
                      </span>
                      {isAnswered && choice.isCorrect && <Badge status="success">Верно</Badge>}
                      {isAnswered && isSelected && !choice.isCorrect && <Badge status="danger">Неверно</Badge>}
                    </div>
                  </button>
                )
              })}
            </div>

            <AnimatePresence>
              {isAnswered && selectedChoice && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ marginTop: 'var(--spacing-24)', padding: 'var(--spacing-16)', backgroundColor: 'var(--color-neutral-10)', borderRadius: 'var(--radius-sm)' }}
                >
                  <p style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-8)' }}>
                    {selectedChoice.isCorrect ? '💡 Почему это верно:' : '❌ Ошибка:'}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-sm)' }}>{selectedChoice.explanation}</p>
                  
                  {selectedChoice.isCorrect && (
                    <Button 
                      variant="primary" 
                      onClick={handleNext} 
                      style={{ marginTop: 'var(--spacing-16)' }}
                    >
                      {currentStep < steps.length - 1 ? 'Следующий шаг' : 'Завершить разбор'}
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </Stack>
    </div>
  )
}

export default TutorSection
