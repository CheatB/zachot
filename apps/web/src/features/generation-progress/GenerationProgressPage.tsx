/**
 * GenerationProgressPage
 * Экран процесса генерации (Running state)
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import AppShell from '@/app/layout/AppShell'
import { Container, Stack, Button, Badge, EmptyState, Tooltip, Card } from '@/ui'
import ProgressSteps from './ProgressSteps'
import GenerationInfo from './GenerationInfo'
import type { ProgressStep } from './types'

// Mock данные генерации
const mockGeneration = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Структурирование текста',
  status: 'running' as const,
  created_at: new Date().toISOString(),
}

// Шаги прогресса
const progressSteps: ProgressStep[] = [
  {
    id: 'analyze',
    label: 'Анализируем материал',
    description: 'Изучаем структуру и содержание вашего текста',
  },
  {
    id: 'structure',
    label: 'Строим структуру',
    description: 'Формируем логическую структуру документа',
  },
  {
    id: 'format',
    label: 'Формируем результат',
    description: 'Создаём финальную версию с форматированием',
  },
]

function GenerationProgressPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [startedAt] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isReturning] = useState(() => {
    // Mock: проверяем, вернулся ли пользователь (можно заменить на реальную логику)
    return sessionStorage.getItem(`generation_${id}_visited`) === 'true'
  })

  // Отмечаем, что пользователь посетил страницу
  useEffect(() => {
    if (id && isAuthenticated) {
      sessionStorage.setItem(`generation_${id}_visited`, 'true')
    }
  }, [id, isAuthenticated])

  // Обновление elapsed time каждую секунду
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startedAt.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, startedAt])

  // Mock: автоматический переход по шагам
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < progressSteps.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 8000) // Переход каждые 8 секунд

    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Mock: автоматический редирект после завершения (через ~30 секунд)
  useEffect(() => {
    if (!isAuthenticated) return

    const timer = setTimeout(() => {
      // Редирект на страницу результата (Front-3.4)
      navigate(`/generations/${id}/result`)
    }, 30000) // 30 секунд для демонстрации

    return () => clearTimeout(timer)
  }, [id, navigate, isAuthenticated])

  if (!isAuthenticated) {
    return (
      <AppShell>
        <EmptyState
          title="Войдите через лэндинг"
          description="Для просмотра генерации необходимо войти"
        />
      </AppShell>
    )
  }

  const shouldReduceMotion = useReducedMotion()
  const elapsedText =
    elapsedTime < 60
      ? `${elapsedTime} ${elapsedTime === 1 ? 'секунду' : elapsedTime < 5 ? 'секунды' : 'секунд'} назад`
      : `${Math.floor(elapsedTime / 60)} ${Math.floor(elapsedTime / 60) === 1 ? 'минуту' : Math.floor(elapsedTime / 60) < 5 ? 'минуты' : 'минут'} назад`

  return (
    <AppShell>
      <Container size="lg">
        <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
          {/* Header блока генерации */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
            }}
          >
            <div className="generation-progress-header">
              <div className="generation-progress-header__main">
                <h1
                  style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-12)',
                  }}
                >
                  {mockGeneration.title}
                </h1>
                <div className="generation-progress-header__meta">
                  <Badge status="warn">В процессе</Badge>
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
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
              delay: 0.1,
            }}
          >
            <div className="generation-progress-card">
              <Card>
                <ProgressSteps steps={progressSteps} currentStepIndex={currentStepIndex} />
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
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
              delay: 0.5,
            }}
            className="generation-progress-actions"
          >
            <div className="generation-progress-actions__group">
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
  gap: var(--spacing-12);
}

.generation-progress-header__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-16);
  flex-wrap: wrap;
}

.generation-progress-header__time {
  display: flex;
  align-items: center;
}

.generation-progress-card {
  width: 100%;
}

.generation-progress-actions {
  width: 100%;
}

.generation-progress-actions__group {
  display: flex;
  gap: var(--spacing-16);
  align-items: center;
  justify-content: flex-start;
}

@media (max-width: 768px) {
  .generation-progress-header__meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-8);
  }
  
  .generation-progress-card {
    padding: var(--spacing-24);
  }
  
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

