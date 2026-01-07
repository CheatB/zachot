/**
 * GenerationProgressPage
 * Экран процесса генерации (Running state)
 * Updated for "juicy" landing page aesthetic
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import AppShell from '@/app/layout/AppShell'
import { Container, Stack, Button, Badge, EmptyState, Tooltip, Card } from '@/ui'
import ProgressSteps from './ProgressSteps'
import GenerationInfo from './GenerationInfo'
import type { ProgressStep } from './types'

// Шаги прогресса для текстов и презентаций
const textProgressSteps: ProgressStep[] = [
  { id: 'analyze', label: 'Анализируем материал', description: 'Изучаем структуру и содержание вашего текста' },
  { id: 'structure', label: 'Строим структуру', description: 'Формируем логическую структуру документа' },
  { id: 'format', label: 'Формируем результат', description: 'Создаём финальную версию с форматированием' },
]

// Шаги прогресса для задач
const taskProgressSteps: ProgressStep[] = [
  { id: 'ocr', label: 'Распознавание', description: 'Извлекаем текст и формулы из ваших материалов' },
  { id: 'logic', label: 'Понимание условия', description: 'Выделяем известные данные и искомые величины' },
  { id: 'plan', label: 'Составление плана', description: 'Выбираем оптимальный алгоритм решения' },
  { id: 'solve', label: 'Решение', description: 'Пошагово вычисляем итоговый результат' },
  { id: 'check', label: 'Проверка', description: 'Контролируем корректность вычислений и логики' },
]

import { getGenerationById, type Generation } from '@/shared/api/generations'

function GenerationProgressPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const shouldReduceMotion = false

  const [generation, setGeneration] = useState<Generation | null>(null)
  const steps = generation?.module === 'TASK' ? taskProgressSteps : textProgressSteps
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [startedAt] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isReturning] = useState(() => {
    return sessionStorage.getItem(`generation_${id}_visited`) === 'true'
  })

  useEffect(() => {
    if (!id || !isAuthenticated) return

    let pollInterval: any

    const checkStatus = async () => {
      try {
        const data = await getGenerationById(id)
        setGeneration(data)

        if (data.status === 'completed') {
          navigate(`/generations/${id}/result`)
        }
      } catch (error) {
        console.error('Failed to poll generation status:', error)
      }
    }

    checkStatus()
    pollInterval = setInterval(checkStatus, 3000)

    return () => clearInterval(pollInterval)
  }, [id, isAuthenticated, navigate])

  useEffect(() => {
    if (id && isAuthenticated) {
      sessionStorage.setItem(`generation_${id}_visited`, 'true')
    }
  }, [id, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startedAt.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [isAuthenticated, startedAt])

  useEffect(() => {
    if (!isAuthenticated) return
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) return prev + 1
        return prev
      })
    }, 8000)
    return () => clearInterval(interval)
  }, [isAuthenticated, steps.length])

  const elapsedText =
    elapsedTime < 60
      ? `${elapsedTime} ${elapsedTime === 1 ? 'секунду' : elapsedTime < 5 ? 'секунды' : 'секунд'} назад`
      : `${Math.floor(elapsedTime / 60)} ${Math.floor(elapsedTime / 60) === 1 ? 'минуту' : Math.floor(elapsedTime / 60) < 5 ? 'минуты' : 'минут'} назад`

  return (
    <AppShell isAuthenticated={isAuthenticated} user={user}>
      {isAuthenticated ? (
        <Container size="lg">
          <Stack gap="xl" style={{ paddingTop: 'var(--spacing-48)', paddingBottom: 'var(--spacing-48)' }}>
            {/* Header блока генерации */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: motionTokens.duration.slow,
                ease: motionTokens.easing.out,
              }}
            >
              <div className="generation-progress-header">
                <div className="generation-progress-header__main">
                  <h1 style={{ marginBottom: 'var(--spacing-16)', color: 'var(--color-neutral-100)' }}>
                    {generation?.title || 'Подготовка работы...'}
                  </h1>
                  <div className="generation-progress-header__meta" style={{ display: 'flex', gap: 'var(--spacing-16)', alignItems: 'center' }}>
                    <Badge status={generation?.status === 'failed' ? 'danger' : 'warn'}>
                      {generation?.status === 'failed' ? 'Ошибка' : 'В процессе'}
                    </Badge>
                    <span
                      className="generation-progress-header__time"
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Генерация запущена {elapsedText} назад
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Progress / Activity section */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: motionTokens.duration.slow,
                ease: motionTokens.easing.out,
                delay: 0.1,
              }}
            >
              <div className="generation-progress-card">
                <Card variant="elevated">
                  <ProgressSteps steps={steps} currentStepIndex={currentStepIndex} />
                </Card>
              </div>
            </motion.div>

            {/* Explanation section */}
            <GenerationInfo isReturning={isReturning} />

            {/* Passive actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: motionTokens.duration.slow,
                ease: motionTokens.easing.out,
                delay: 0.5,
              }}
              className="generation-progress-actions"
            >
              <div className="generation-progress-actions__group" style={{ display: 'flex', gap: 'var(--spacing-16)', alignItems: 'center' }}>
                <Button variant="secondary" onClick={() => navigate('/generations')}>
                  Вернуться к списку
                </Button>
                <Tooltip content="Генерация выполняется в фоновом режиме. Вы можете закрыть страницу и вернуться позже.">
                  <Button variant="ghost" size="sm">
                    Что происходит?
                  </Button>
                </Tooltip>
              </div>
            </motion.div>
          </Stack>
        </Container>
      ) : (
        <EmptyState
          title="Войдите через лэндинг"
          description="Для просмотра генерации необходимо войти"
        />
      )}
    </AppShell>
  )
}

export default GenerationProgressPage

const pageStyles = `
.generation-progress-header {
  width: 100%;
}

.generation-progress-header__main {
  display: flex;
  flex-direction: column;
}

.generation-progress-card {
  width: 100%;
}

@media (max-width: 768px) {
  .generation-progress-actions__group {
    flex-direction: column;
    width: 100%;
  }
  
  .generation-progress-actions__group button {
    width: 100%;
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'generation-progress-page-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = pageStyles
    document.head.appendChild(style)
  }
}
