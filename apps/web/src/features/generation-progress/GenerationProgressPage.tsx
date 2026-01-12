/**
 * GenerationProgressPage
 * Экран процесса генерации (Running state)
 * Redesigned for a more premium, "juicy" aesthetic.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/app/auth/useAuth'
import { Container, Stack, Button, Badge, Card, Tooltip } from '@/ui'
import ProgressSteps from './ProgressSteps'
import GenerationInfo from './GenerationInfo'
import type { ProgressStep } from './types'
import { getGenerationById, type Generation } from '@/shared/api/generations'

const textProgressSteps: ProgressStep[] = [
  { id: 'analyze', label: 'Анализируем материал', description: 'Изучаем структуру и содержание вашего текста' },
  { id: 'structure', label: 'Строим структуру', description: 'Формируем логическую структуру документа' },
  { id: 'format', label: 'Формируем результат', description: 'Создаём финальную версию с форматированием' },
]

const taskProgressSteps: ProgressStep[] = [
  { id: 'ocr', label: 'Распознавание', description: 'Извлекаем текст и формулы из ваших материалов' },
  { id: 'logic', label: 'Понимание условия', description: 'Выделяем известные данные и искомые величины' },
  { id: 'plan', label: 'Составление плана', description: 'Выбираем оптимальный алгоритм решения' },
  { id: 'solve', label: 'Решение', description: 'Пошагово вычисляем итоговый результат' },
  { id: 'check', label: 'Проверка', description: 'Контролируем корректность вычислений и логики' },
]

function GenerationProgressPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [generation, setGeneration] = useState<Generation | null>(null)
  const steps = generation?.module === 'TASK' ? taskProgressSteps : textProgressSteps
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isReturning] = useState(() => {
    return localStorage.getItem(`generation_${id}_visited`) === 'true'
  })

  useEffect(() => {
    if (!id || !isAuthenticated) return

    const checkStatus = async () => {
      try {
        const data = await getGenerationById(id)
        setGeneration(data)

        if (data.status === 'COMPLETED' || data.status === 'GENERATED' || data.status === 'EXPORTED') {
          navigate(`/generations/${id}/result`)
        }
      } catch (error) {
        console.error('Failed to poll generation status:', error)
      }
    }

    checkStatus()
    const pollInterval = setInterval(checkStatus, 3000)
    return () => clearInterval(pollInterval)
  }, [id, isAuthenticated, navigate])

  useEffect(() => {
    if (id && isAuthenticated) {
      localStorage.setItem(`generation_${id}_visited`, 'true')
    }
  }, [id, isAuthenticated])

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 8000)
    return () => clearInterval(interval)
  }, [steps.length])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!isAuthenticated) return null

  return (
    <div className="progress-page-v2">
      <Container size="md">
        <Stack gap="2xl" style={{ paddingTop: 'var(--spacing-48)', paddingBottom: 'var(--spacing-64)' }}>
          
          {/* Main Status Header */}
          <motion.div 
            className="status-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="status-header__left">
              <Badge status={generation?.status === 'FAILED' ? 'danger' : 'warn'} className="status-badge">
                {generation?.status === 'FAILED' ? 'Ошибка генерации' : 'Выполняем работу'}
              </Badge>
              <h1 className="status-header__title">{generation?.title || 'Новая генерация'}</h1>
            </div>
            <div className="status-header__right">
              <div className="timer">
                <span className="timer__label">Прошло времени:</span>
                <span className="timer__value">{formatTime(elapsedTime)}</span>
              </div>
            </div>
          </motion.div>

          {/* Central Progress Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="default" style={{ padding: 'var(--spacing-40)', border: '1px solid var(--color-border-base)', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', borderRadius: '24px' }}>
              <ProgressSteps steps={steps} currentStepIndex={currentStepIndex} />
            </Card>
          </motion.div>

          {/* Info & Actions Grid */}
          <div className="progress-grid">
            <div className="progress-grid__info">
              <GenerationInfo isReturning={isReturning} />
            </div>
            
            <div className="progress-grid__actions">
              <Card variant="default" style={{ padding: 'var(--spacing-24)', backgroundColor: 'var(--color-neutral-5)', height: '100%', borderRadius: '20px' }}>
                <Stack gap="lg" align="center" justify="center" style={{ height: '100%', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Вы можете не ждать окончания и вернуться к работе позже — мы пришлем уведомление.
                  </p>
                  <Button variant="secondary" onClick={() => navigate('/generations')} style={{ width: '100%' }}>
                    Вернуться к списку
                  </Button>
                  <Tooltip content="Генерация происходит на удаленных серверах. Ваш компьютер не нагружается.">
                    <button className="help-link">Как это работает?</button>
                  </Tooltip>
                </Stack>
              </Card>
            </div>
          </div>

        </Stack>
      </Container>

      <style>{`
        .progress-page-v2 {
          width: 100%;
          background-color: var(--color-surface-base);
        }
        
        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
        }
        
        .status-header__title {
          font-size: 32px;
          font-weight: 800;
          color: var(--color-neutral-110);
          margin: 12px 0 0 0;
          letter-spacing: -0.02em;
        }
        
        .status-badge {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 6px 12px;
        }
        
        .timer {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        
        .timer__label {
          font-size: 12px;
          color: var(--color-text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }
        
        .timer__value {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-accent-base);
          font-variant-numeric: tabular-nums;
        }
        
        .progress-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
        }
        
        .help-link {
          background: none;
          border: none;
          color: var(--color-text-muted);
          font-size: 13px;
          text-decoration: underline;
          cursor: help;
          padding: 0;
        }
        
        @media (max-width: 900px) {
          .progress-grid {
            grid-template-columns: 1fr;
          }
          .status-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .timer {
            align-items: flex-start;
          }
          .status-header__title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  )
}

export default GenerationProgressPage
