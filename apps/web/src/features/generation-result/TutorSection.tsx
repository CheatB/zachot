/**
 * TutorSection
 * Интерактивный разбор задачи по шагам
 */

import { useState, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Button, Stack, Badge, Formula } from '@/ui'

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

function TutorSection({ }: TutorSectionProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)

  // Mock-данные шагов (в реальности приходят с бэкенда)
  const steps: Step[] = [
    {
      id: 1,
      title: 'Шаг 1. Анализ условия',
      content: 'Для решения квадратного уравнения $ax^2 + bx + c = 0$ первым делом нужно найти дискриминант. Какая формула для него верна?',
      choices: [
        { id: 'a', text: '$D = b^2 - 4ac$', isCorrect: true, explanation: 'Это классическая формула дискриминанта.' },
        { id: 'b', text: '$D = b^2 + 4ac$', isCorrect: false, explanation: 'Знак должен быть минус.' },
        { id: 'c', text: '$D = a^2 - 4bc$', isCorrect: false, explanation: 'Вы перепутали коэффициенты.' },
      ]
    },
    {
      id: 2,
      title: 'Шаг 2. Вычисление корней',
      content: 'Отлично! Дискриминант найден. Теперь выберем формулу для поиска корней $x$.',
      choices: [
        { id: 'd', text: '$x = \\frac{-b \\pm \\sqrt{D}}{2a}$', isCorrect: true, explanation: 'Верно, это общая формула корней.' },
        { id: 'e', text: '$x = \\frac{b \\pm \\sqrt{D}}{2a}$', isCorrect: false, explanation: 'Перед b должен стоять минус.' },
      ]
    }
  ]

  const renderTextWithFormulas = (text: string) => {
    const parts = text.split(/(\$.*?\$)/g)
    return parts.map((part, i) => {
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
            <div style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-24)', color: 'var(--color-text-primary)' }}>
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
                      <span style={{ fontSize: 'var(--font-size-base)', fontWeight: isSelected ? 'bold' : 'normal' }}>
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
                  <p>{selectedChoice.explanation}</p>
                  
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
