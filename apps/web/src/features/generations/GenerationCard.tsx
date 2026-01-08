/**
 * GenerationCard component
 * Карточка генерации с hover эффектами
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Badge } from '@/ui'
import type { Generation } from '@/shared/api/generations'
import { formatRelativeTime } from '@/utils/format'
import clsx from 'clsx'

interface GenerationCardProps {
  generation: Generation
  onClick?: () => void
}

function GenerationCard({ generation, onClick }: GenerationCardProps) {
  const getStatusLabel = (status: Generation['status']): string => {
    switch (status) {
      case 'COMPLETED':
      case 'GENERATED':
      case 'EXPORTED':
        return 'Завершено'
      case 'RUNNING':
        return 'В процессе'
      case 'FAILED':
        return 'Ошибка'
      case 'DRAFT':
        return 'Черновик'
      case 'WAITING_USER':
        return 'Ожидает вас'
      default:
        return status
    }
  }

  const getStatusBadgeStatus = (status: Generation['status']): 'neutral' | 'success' | 'warn' | 'danger' => {
    switch (status) {
      case 'COMPLETED':
      case 'GENERATED':
      case 'EXPORTED':
        return 'success'
      case 'RUNNING':
      case 'WAITING_USER':
        return 'warn'
      case 'FAILED':
        return 'danger'
      case 'DRAFT':
        return 'neutral'
      default:
        return 'neutral'
    }
  }

  const getModuleLabel = (module: Generation['module']): string => {
    switch (module) {
      case 'TEXT':
        return 'Текст'
      case 'PRESENTATION':
        return 'Презентация'
      case 'TASK':
        return 'Задачи'
      default:
        return module
    }
  }

  const getActionHint = (status: Generation['status']): string => {
    switch (status) {
      case 'COMPLETED':
      case 'GENERATED':
      case 'EXPORTED':
        return 'Открыть'
      case 'RUNNING':
        return 'В процессе…'
      case 'FAILED':
        return 'Попробовать снова'
      case 'DRAFT':
      case 'WAITING_USER':
        return 'Продолжить'
      default:
        return ''
    }
  }

  const shouldReduceMotion = false

  return (
    <motion.button
      className={clsx('generation-card', `generation-card--${generation.status.toLowerCase()}`)}
      onClick={onClick}
      whileHover={
        !shouldReduceMotion
          ? {
              y: -2,
              transition: {
                duration: motionTokens.duration.fast,
                ease: motionTokens.easing.out,
              },
            }
          : undefined
      }
      whileTap={{
        y: 0,
        transition: {
          duration: motionTokens.duration.fast,
          ease: motionTokens.easing.out,
        },
      }}
      aria-label={`${generation.title}, ${getStatusLabel(generation.status)}`}
    >
      <div className="generation-card__header">
        <h3 className="generation-card__title">{generation.title}</h3>
        <div className="generation-card__badges">
          <Badge status="neutral">{getModuleLabel(generation.module)}</Badge>
          <Badge status={getStatusBadgeStatus(generation.status)}>{getStatusLabel(generation.status)}</Badge>
        </div>
      </div>
      <div className="generation-card__footer">
        <span className="generation-card__time">{formatRelativeTime(generation.updated_at)}</span>
        <span className="generation-card__action">{getActionHint(generation.status)}</span>
      </div>
    </motion.button>
  )
}

export default GenerationCard

const cardStyles = `
.generation-card {
  width: 100%;
  padding: var(--spacing-20);
  background-color: var(--color-surface-base);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-lg);
  text-align: left;
  cursor: pointer;
  transition: all var(--motion-duration-base) ease;
  box-shadow: var(--elevation-1);
}

@media (hover: hover) and (pointer: fine) {
  .generation-card:hover {
    box-shadow: var(--elevation-2);
    border-color: var(--color-border-dark);
  }
}

.generation-card:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring-offset);
}

.generation-card__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
  margin-bottom: var(--spacing-16);
}

.generation-card__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.generation-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-8);
}

.generation-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-16);
  border-top: 1px solid var(--color-border-light);
}

.generation-card__time {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.generation-card__action {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-accent-base);
}

.generation-card--running .generation-card__action {
  color: var(--color-warn-base);
}

.generation-card--failed .generation-card__action {
  color: var(--color-danger-base);
}

@media (max-width: 768px) {
  .generation-card {
    padding: var(--spacing-24);
    min-height: 120px;
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'generation-card-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = cardStyles
    document.head.appendChild(style)
  }
}

