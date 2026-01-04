/**
 * GenerationRecoveryPage
 * Экран восстановления после ошибки генерации
 */

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import AppShell from '@/app/layout/AppShell'
import { Container, Stack, Button, Card, EmptyState } from '@/ui'

function GenerationRecoveryPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

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

  const handleRetry = () => {
    // TODO: Редирект на создание новой генерации с теми же параметрами
    navigate('/generations/new')
  }

  const handleNewGeneration = () => {
    navigate('/generations/new')
  }

  const handleBackToList = () => {
    navigate('/generations')
  }

  return (
    <AppShell>
      <Container size="lg">
        <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
            }}
          >
            <div className="recovery-header">
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
                  marginBottom: 'var(--spacing-12)',
                }}
              >
                Такое иногда случается. Это не ваша ошибка.
              </p>
            </div>
          </motion.div>

          {/* Explanation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
              delay: 0.1,
            }}
          >
            <Card className="recovery-explanation">
              <div className="recovery-explanation__content">
                <h3
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-16)',
                  }}
                >
                  Что происходит?
                </h3>
                <ul className="recovery-explanation__list">
                  <li className="recovery-explanation__item">
                    <span
                      style={{
                        fontSize: 'var(--font-size-base)',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 'var(--line-height-relaxed)',
                      }}
                    >
                      <strong style={{ color: 'var(--color-text-primary)' }}>
                        Что могло пойти не так:
                      </strong>{' '}
                      Временные проблемы с обработкой, слишком большой объём данных или неожиданная ошибка системы.
                    </span>
                  </li>
                  <li className="recovery-explanation__item">
                    <span
                      style={{
                        fontSize: 'var(--font-size-base)',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 'var(--line-height-relaxed)',
                      }}
                    >
                      <strong style={{ color: 'var(--color-text-primary)' }}>
                        Что можно сделать сейчас:
                      </strong>{' '}
                      Попробуйте создать генерацию ещё раз. Чаще всего это помогает.
                    </span>
                  </li>
                  <li className="recovery-explanation__item">
                    <span
                      style={{
                        fontSize: 'var(--font-size-base)',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 'var(--line-height-relaxed)',
                      }}
                    >
                      <strong style={{ color: 'var(--color-text-primary)' }}>
                        Что сохранено:
                      </strong>{' '}
                      Ваш запрос сохранён. Вы можете вернуться к нему позже или создать новый.
                    </span>
                  </li>
                </ul>
              </div>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="recovery-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
              delay: 0.2,
            }}
          >
            <div className="recovery-actions__primary">
              <Button variant="primary" onClick={handleRetry}>
                Попробовать ещё раз
              </Button>
              <Button variant="secondary" onClick={handleNewGeneration}>
                Создать новую генерацию
              </Button>
            </div>
            <div className="recovery-actions__secondary">
              <Button variant="ghost" onClick={handleBackToList}>
                Вернуться к списку
              </Button>
            </div>
          </motion.div>
        </Stack>
      </Container>
    </AppShell>
  )
}

export default GenerationRecoveryPage

const recoveryStyles = `
.recovery-header {
  width: 100%;
}

.recovery-explanation {
  background-color: var(--color-neutral-20);
  border: 1px solid var(--color-border-light);
}

.recovery-explanation__content {
  padding: var(--spacing-20);
}

.recovery-explanation__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-20);
  list-style: none;
  padding: 0;
  margin: 0;
}

.recovery-explanation__item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-12);
}

.recovery-explanation__item::before {
  content: '•';
  color: var(--color-accent-base);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-normal);
  flex-shrink: 0;
}

.recovery-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
}

.recovery-actions__primary {
  display: flex;
  gap: var(--spacing-16);
  flex-wrap: wrap;
}

.recovery-actions__secondary {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 768px) {
  .recovery-actions__primary {
    flex-direction: column;
  }
  
  .recovery-actions__primary button {
    width: 100%;
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'generation-recovery-page-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = recoveryStyles
    document.head.appendChild(style)
  }
}

