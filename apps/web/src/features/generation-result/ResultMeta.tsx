/**
 * ResultMeta component
 * Мета информация о генерации
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Badge } from '@/ui'

interface ResultMetaProps {
  type: 'TEXT' | 'PRESENTATION' | 'TASK'
  durationSeconds?: number
}

function ResultMeta({ type, durationSeconds }: ResultMetaProps) {
  const getTypeLabel = (t: string): string => {
    switch (t) {
      case 'TEXT':
        return 'Текст'
      case 'PRESENTATION':
        return 'Презентация'
      case 'TASK':
        return 'Задачи'
      default:
        return t
    }
  }

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '—'
    if (seconds < 60) return `${seconds} сек`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (remainingSeconds === 0) return `${minutes} мин`
    return `${minutes} мин ${remainingSeconds} сек`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
        delay: 0.3,
      }}
    >
      <Card className="result-meta">
        <div className="result-meta__content">
          <div className="result-meta__row">
            <span
              className="result-meta__label"
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
              }}
            >
              Тип генерации:
            </span>
            <Badge status="neutral">{getTypeLabel(type)}</Badge>
          </div>
          <div className="result-meta__row">
            <span
              className="result-meta__label"
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
              }}
            >
              Время выполнения:
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {formatDuration(durationSeconds)}
            </span>
          </div>
          <div className="result-meta__hint">
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
                lineHeight: 'var(--line-height-relaxed)',
              }}
            >
              Результат сохранён и доступен позже
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default ResultMeta

const metaStyles = `
.result-meta {
  background-color: var(--color-neutral-20);
  border: 1px solid var(--color-border-light);
}

.result-meta {
  padding: var(--spacing-20);
}

.result-meta__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
}

.result-meta__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-meta__hint {
  margin-top: var(--spacing-8);
  padding-top: var(--spacing-12);
  border-top: 1px solid var(--color-border-light);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'result-meta-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = metaStyles
    document.head.appendChild(style)
  }
}

