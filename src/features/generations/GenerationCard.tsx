/**
 * GenerationCard component
 * Карточка генерации с hover эффектами
 * Refactored to use CSS Modules
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Badge } from '@/ui'
import type { Generation } from '@/shared/api/generations'
import { formatRelativeTime } from '@/utils/format'
import clsx from 'clsx'
import styles from './GenerationCard.module.css'

interface GenerationCardProps {
  generation: Generation
  onClick?: () => void
}

function GenerationCard({ generation, onClick }: GenerationCardProps) {
  const status = (generation.status || '').toUpperCase()

  const getStatusLabel = (s: string): string => {
    switch (s) {
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
        return s
    }
  }

  const getStatusBadgeStatus = (s: string): 'neutral' | 'success' | 'warn' | 'danger' => {
    switch (s) {
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
    const m = (module || '').toUpperCase()
    switch (m) {
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

  const getActionHint = (s: string): string => {
    switch (s) {
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
      className={clsx(
        styles.generationCard, 
        status === 'DRAFT' && styles.generationCardDraft,
        status === 'RUNNING' && styles.generationCardRunning,
        status === 'FAILED' && styles.generationCardFailed
      )}
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
      aria-label={`${generation.title}, ${getStatusLabel(status)}`}
    >
      <div className={styles.generationCardHeader}>
        <h3 className={styles.generationCardTitle}>{generation.title}</h3>
        <div className={styles.generationCardBadges}>
          <Badge status="neutral">{getModuleLabel(generation.module)}</Badge>
          <Badge status={getStatusBadgeStatus(status)}>{getStatusLabel(status)}</Badge>
        </div>
      </div>
      <div className={styles.generationCardFooter}>
        <span className={styles.generationCardTime}>{formatRelativeTime(generation.updated_at)}</span>
        <span className={styles.generationCardAction}>{getActionHint(status)}</span>
      </div>
    </motion.button>
  )
}

export default GenerationCard
