/**
 * GenerationResultPage
 * Экран результата генерации (Completed / Failed)
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import AppShell from '@/app/layout/AppShell'
import { Container, Stack, Button, Badge, EmptyState, Card } from '@/ui'
import ResultContent from './ResultContent'
import ResultActions from './ResultActions'
import ResultMeta from './ResultMeta'
import DegradedBanner from './DegradedBanner'
import type { GenerationResult } from './types'
import { formatRelativeTime } from '@/utils/format'

// Mock данные для completed генерации
const mockCompletedResult: GenerationResult = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Структурирование текста',
  type: 'text',
  status: 'completed',
  completed_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 минут назад
  duration_seconds: 127,
  result_content: `# История России: основные этапы

## Введение

История России — это многовековая история развития государства, которое прошло через множество трансформаций и стало одной из крупнейших держав мира.

## Древняя Русь (IX–XIII века)

- Формирование древнерусского государства
- Принятие христианства в 988 году
- Развитие культуры и письменности
- Феодальная раздробленность

## Московское царство (XIV–XVII века)

- Объединение русских земель вокруг Москвы
- Освобождение от монголо-татарского ига
- Укрепление централизованной власти
- Расширение территории государства

## Российская империя (XVIII–начало XX века)

- Реформы Петра I
- Эпоха просвещения
- Отечественная война 1812 года
- Отмена крепостного права в 1861 году
- Революционные движения начала XX века

## Советский период (1917–1991)

- Октябрьская революция 1917 года
- Гражданская война
- Индустриализация и коллективизация
- Великая Отечественная война
- Холодная война
- Распад СССР

## Современная Россия (с 1991 года)

- Формирование новой государственности
- Экономические реформы
- Развитие демократических институтов
- Современные вызовы и достижения

## Заключение

История России демонстрирует способность народа к адаптации и развитию в различных исторических условиях.`,
}

// Mock данные для failed генерации
const mockFailedResult: GenerationResult = {
  id: '00000000-0000-0000-0000-000000000002',
  title: 'Подготовка презентации',
  type: 'presentation',
  status: 'failed',
  completed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  error_message: 'Не удалось обработать материал',
}

function GenerationResultPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [result] = useState<GenerationResult>(
    id?.includes('failed') ? mockFailedResult : mockCompletedResult
  )
  const [isDegraded] = useState(id?.includes('degraded') || false)

  if (!isAuthenticated) {
    return (
      <AppShell>
        <EmptyState
          title="Войдите через лэндинг"
          description="Для просмотра результата необходимо войти"
        />
      </AppShell>
    )
  }

  const handleCopy = () => {
    if (result.result_content) {
      navigator.clipboard.writeText(result.result_content)
    }
  }

  const handleNewGeneration = () => {
    navigate('/generations/new')
  }

  const handleBackToList = () => {
    navigate('/generations')
  }

  const handleRetry = () => {
    navigate('/generations/new')
  }

  const shouldReduceMotion = useReducedMotion()

  // Failed state
  if (result.status === 'failed') {
    return (
      <AppShell>
        <Container size="lg">
          <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: motionTokens.duration.base,
                ease: motionTokens.easing.out,
              }}
            >
              <div className="result-header">
                <h1
                  style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-12)',
                  }}
                >
                  Не удалось завершить генерацию
                </h1>
                <p
                  style={{
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--line-height-relaxed)',
                    marginBottom: 'var(--spacing-24)',
                  }}
                >
                  Иногда такое случается. Мы уже знаем об ошибке и работаем над её исправлением.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: motionTokens.duration.base,
                ease: motionTokens.easing.out,
                delay: 0.1,
              }}
            >
              <Card className="result-explanation">
                <div className="result-explanation__content">
                  <h3
                    style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--spacing-12)',
                    }}
                  >
                    Что можно сделать?
                  </h3>
                  <ul
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--spacing-12)',
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    <li
                      style={{
                        fontSize: 'var(--font-size-base)',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 'var(--line-height-relaxed)',
                      }}
                    >
                      Попробуйте создать генерацию ещё раз
                    </li>
                    <li
                      style={{
                        fontSize: 'var(--font-size-base)',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 'var(--line-height-relaxed)',
                      }}
                    >
                      Проверьте, что введённый материал корректен
                    </li>
                    <li
                      style={{
                        fontSize: 'var(--font-size-base)',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 'var(--line-height-relaxed)',
                      }}
                    >
                      Если проблема повторяется, обратитесь в поддержку
                    </li>
                  </ul>
                </div>
              </Card>
            </motion.div>

            <motion.div
              className="result-actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: motionTokens.duration.base,
                ease: motionTokens.easing.out,
                delay: 0.2,
              }}
            >
              <div className="result-actions__primary">
                <Button variant="primary" onClick={handleRetry}>
                  Попробовать ещё раз
                </Button>
                <Button variant="secondary" onClick={handleBackToList}>
                  Вернуться к списку
                </Button>
              </div>
            </motion.div>
          </Stack>
        </Container>
      </AppShell>
    )
  }

  // Completed state
  return (
    <AppShell>
      <Container size="lg">
        <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
          {/* Result Header */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
            }}
          >
            <div className="result-header">
              <h1
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-12)',
                }}
              >
                Готово
              </h1>
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--line-height-relaxed)',
                  marginBottom: 'var(--spacing-12)',
                }}
              >
                Материал успешно структурирован и готов к использованию
              </p>
              <div className="result-header__meta">
                <Badge status="success">Завершено</Badge>
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Генерация завершена {formatRelativeTime(result.completed_at)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Degraded Banner */}
          {isDegraded && (
            <DegradedBanner
              onContinue={() => {}}
              onNewGeneration={handleNewGeneration}
            />
          )}

          {/* Result Content */}
          {result.result_content && (
            <ResultContent content={result.result_content} type={result.type} />
          )}

          {/* Actions */}
          <ResultActions
            onCopy={handleCopy}
            onNewGeneration={handleNewGeneration}
            onBackToList={handleBackToList}
            isDegraded={isDegraded}
            onContinue={() => {}}
          />

          {/* Meta / Secondary info */}
          <ResultMeta type={result.type} durationSeconds={result.duration_seconds} />

          {/* Feedback hint */}
          <motion.div
            className="result-feedback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
              delay: 0.4,
            }}
          >
            <Card className="result-feedback-card">
              <div className="result-feedback__content">
                <p
                  style={{
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--spacing-12)',
                    lineHeight: 'var(--line-height-relaxed)',
                  }}
                >
                  Полезен ли результат?
                </p>
                <div className="result-feedback__buttons">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                    aria-label="Результат полезен"
                  >
                    👍
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                    aria-label="Результат не полезен"
                  >
                    👎
                  </Button>
                </div>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    marginTop: 'var(--spacing-12)',
                    lineHeight: 'var(--line-height-relaxed)',
                  }}
                >
                  Это поможет нам улучшить качество генераций
                </p>
              </div>
            </Card>
          </motion.div>
        </Stack>
      </Container>
    </AppShell>
  )
}

export default GenerationResultPage

const pageStyles = `
.result-header {
  width: 100%;
}

.result-header__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-16);
  flex-wrap: wrap;
}

.result-explanation {
  background-color: var(--color-neutral-20);
  border: 1px solid var(--color-border-light);
}

.result-explanation__content {
  padding: var(--spacing-20);
}

.result-feedback-card {
  background-color: var(--color-neutral-20);
  border: 1px solid var(--color-border-light);
}

.result-feedback__content {
  text-align: center;
  padding: var(--spacing-20);
}

.result-feedback__buttons {
  display: flex;
  gap: var(--spacing-12);
  justify-content: center;
  align-items: center;
}

@media (max-width: 768px) {
  .result-header__meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-8);
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'generation-result-page-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = pageStyles
    document.head.appendChild(style)
  }
}

