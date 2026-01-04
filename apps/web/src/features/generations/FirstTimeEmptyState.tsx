/**
 * FirstTimeEmptyState component
 * Специальный empty state для первого входа в продукт
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Button, Card } from '@/ui'

interface FirstTimeEmptyStateProps {
  onCreateFirst: () => void
}

function FirstTimeEmptyState({ onCreateFirst }: FirstTimeEmptyStateProps) {
  const valuePoints = [
    {
      icon: '📄',
      text: 'Структурируем материалы',
    },
    {
      icon: '⚡',
      text: 'Помогаем быстро разобраться',
    },
    {
      icon: '💾',
      text: 'Результаты сохраняются',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
      }}
      className="first-time-empty"
    >
      <Card className="first-time-empty__card">
        <div className="first-time-empty__content">
          <h2
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-12)',
              textAlign: 'center',
            }}
          >
            Добро пожаловать
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-relaxed)',
              marginBottom: 'var(--spacing-24)',
              textAlign: 'center',
            }}
          >
            Здесь будут ваши генерации — начнём с первой
          </p>

          <div className="first-time-empty__value-points">
            {valuePoints.map((point, index) => (
              <motion.div
                key={index}
                className="first-time-empty__point"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: motionTokens.duration.base,
                  ease: motionTokens.easing.out,
                  delay: 0.1 * (index + 1),
                }}
              >
                <span
                  className="first-time-empty__icon"
                  style={{
                    fontSize: 'var(--font-size-2xl)',
                    marginBottom: 'var(--spacing-8)',
                  }}
                  aria-hidden="true"
                >
                  {point.icon}
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--line-height-relaxed)',
                    textAlign: 'center',
                  }}
                >
                  {point.text}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="first-time-empty__actions">
            <Button variant="primary" size="lg" onClick={onCreateFirst}>
              Создать первую генерацию
            </Button>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--spacing-12)',
                textAlign: 'center',
              }}
            >
              Это займёт пару минут
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default FirstTimeEmptyState

const firstTimeStyles = `
.first-time-empty {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.first-time-empty__card {
  background-color: var(--color-surface-base);
  border: 1px solid var(--color-border-light);
  padding: var(--spacing-32);
}

.first-time-empty__content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.first-time-empty__value-points {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-24);
  width: 100%;
  margin-bottom: var(--spacing-32);
}

.first-time-empty__point {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.first-time-empty__icon {
  display: block;
}

.first-time-empty__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

@media (max-width: 768px) {
  .first-time-empty__card {
    padding: var(--spacing-24);
  }
  
  .first-time-empty__value-points {
    grid-template-columns: 1fr;
    gap: var(--spacing-20);
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'first-time-empty-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = firstTimeStyles
    document.head.appendChild(style)
  }
}

