/**
 * GenerationProgressPage
 * Экран процесса генерации (Running state)
 * Redesigned for a more premium, "juicy" aesthetic.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/app/auth/useAuth'
import { Container, Stack, Badge } from '@/ui'
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

const gostProgressSteps: ProgressStep[] = [
  { id: 'scan', label: 'Анализ документа', description: 'Проверяем текущее оформление и структуру' },
  { id: 'correct', label: 'Исправление ошибок', description: 'Устраняем орфографические и пунктуационные недочеты' },
  { id: 'format', label: 'Применение ГОСТа', description: 'Настраиваем шрифты, отступы и поля по стандарту' },
  { id: 'finalize', label: 'Финализация', description: 'Подготавливаем итоговый файл для скачивания' },
]

function GenerationProgressPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [generation, setGeneration] = useState<Generation | null>(null)
  const steps = generation?.module === 'TASK' 
    ? taskProgressSteps 
    : generation?.module === 'GOST_FORMAT'
      ? gostProgressSteps
      : textProgressSteps
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [generationProgress, setGenerationProgress] = useState(0) // Процент прогресса генерации
  
  // Расчёт примерного времени генерации
  const estimatedTime = generation ? (() => {
    const volume = generation.input_payload?.volume || 10
    const structureItems = generation.settings_payload?.structure?.length || 0
    
    // Более точный расчёт с учётом количества разделов:
    // - Структура + источники: ~60 сек
    // - Генерация по разделам: ~25 сек на раздел (Claude 3.5 Sonnet медленнее)
    // - QC: ~20 сек
    
    let totalSeconds = 60 // Структура + источники
    
    if (structureItems > 0) {
      // Если известно количество разделов - используем его
      totalSeconds += structureItems * 25
    } else {
      // Иначе оцениваем по объёму: ~1.5 раздела на страницу
      const estimatedSections = Math.ceil(volume * 1.5)
      totalSeconds += estimatedSections * 25
    }
    
    totalSeconds += 20 // QC
    
    return Math.ceil(totalSeconds / 60) // В минутах
  })() : 3

  useEffect(() => {
    if (!id || !isAuthenticated) return

    const checkStatus = async () => {
      try {
        const data = await getGenerationById(id)
        setGeneration(data)

        // Рассчитываем процент прогресса на основе времени
        if (data.module === 'TEXT') {
          // Используем elapsed time для примерной оценки прогресса
          const estimatedTotalTime = estimatedTime * 60 // в секундах
          const progress = estimatedTotalTime > 0 
            ? Math.min(Math.round((elapsedTime / estimatedTotalTime) * 100), 99) 
            : 0
          setGenerationProgress(progress)
        }

        if (data.status === 'COMPLETED' || data.status === 'GENERATED' || data.status === 'EXPORTED') {
          setGenerationProgress(100) // Завершено
          // Перенаправить на страницу редактора для текстовых работ
          if (data.module === 'TEXT') {
            navigate(`/generations/${id}/editor`)
          } else {
            // Для презентаций и задач - сразу на результат
            navigate(`/generations/${id}/result`)
          }
        }
      } catch (error) {
        console.error('Failed to poll generation status:', error)
      }
    }

    checkStatus()
    const pollInterval = setInterval(checkStatus, 3000)
    return () => clearInterval(pollInterval)
  }, [id, isAuthenticated, navigate, elapsedTime, estimatedTime])

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
              <h1 className="status-header__title">
                {generation?.title && generation.title !== 'Без названия' ? generation.title : 'Генерация глав'}
              </h1>
              {/* Процент прогресса */}
              {generationProgress > 0 && (
                <div className="progress-percentage">
                  <div className="progress-percentage__bar">
                    <motion.div 
                      className="progress-percentage__fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="progress-percentage__text">{generationProgress}% завершено</span>
                </div>
              )}
            </div>
            <div className="status-header__right">
              <div className="timer">
                <span className="timer__label">Прошло времени:</span>
                <span className="timer__value">{formatTime(elapsedTime)}</span>
                {elapsedTime >= estimatedTime * 60 && (
                  <span className="timer__overtime">
                    Осталось совсем немного, потерпите, скоро всё будет!
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Central Progress - БЕЗ Card контейнера */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{ padding: 'var(--spacing-24) 0' }}
          >
            <ProgressSteps steps={steps} currentStepIndex={currentStepIndex} />
          </motion.div>

          {/* Info & Actions */}
          <Stack gap="xl" style={{ marginTop: 'var(--spacing-12)' }}>
            <GenerationInfo 
              volume={generation?.input_payload?.volume || 10}
              estimatedTime={estimatedTime}
            />
          </Stack>

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
        
        .progress-percentage {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .progress-percentage__bar {
          width: 100%;
          max-width: 400px;
          height: 8px;
          background-color: var(--color-neutral-20);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        
        .progress-percentage__fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-accent-base) 0%, var(--color-success-base) 100%);
          border-radius: var(--radius-full);
          transition: width 0.5s ease-out;
        }
        
        .progress-percentage__text {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-accent-base);
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
        
        .timer__overtime {
          font-size: 11px;
          color: var(--color-warn-base);
          font-weight: 600;
          margin-top: 4px;
          text-align: right;
          max-width: 200px;
          line-height: 1.3;
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
