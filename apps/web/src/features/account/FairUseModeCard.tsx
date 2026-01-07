/**
 * FairUseModeCard component
 * Карточка с информацией о режиме fair use
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Badge } from '@/ui'
import type { FairUseMode } from './types'

interface FairUseModeCardProps {
  mode: FairUseMode
}

function FairUseModeCard({ mode }: FairUseModeCardProps) {
  const getModeInfo = () => {
    switch (mode) {
      case 'normal':
        return {
          label: 'Обычный режим',
          message: 'Система работает в обычном режиме',
          badgeStatus: 'success' as const,
        }
      case 'degraded':
        return {
          label: 'Щадящий режим',
          message: 'Временно применяется более щадящий режим обработки',
          badgeStatus: 'warn' as const,
        }
      case 'strict':
        return {
          label: 'Ограниченный режим',
          message: 'Генерации временно ограничены',
          badgeStatus: 'neutral' as const,
        }
      default:
        return {
          label: 'Неизвестно',
          message: 'Режим работы не определён',
          badgeStatus: 'neutral' as const,
        }
    }
  }

  const modeInfo = getModeInfo()

  const shouldReduceMotion = false

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
        delay: 0.2,
      }}
    >
      <Card className="fair-use-mode-card">
        <div className="fair-use-mode-card__content">
          <div className="fair-use-mode-card__header">
            <h3
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-8)',
              }}
            >
              Режим работы системы
            </h3>
            <Badge status={modeInfo.badgeStatus}>{modeInfo.label}</Badge>
          </div>
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-relaxed)',
              marginTop: 'var(--spacing-12)',
            }}
          >
            {modeInfo.message}
          </p>
        </div>
      </Card>
    </motion.div>
  )
}

export default FairUseModeCard

const cardStyles = `
.fair-use-mode-card {
  background-color: var(--color-neutral-20);
  border: 1px solid var(--color-border-light);
}

.fair-use-mode-card__content {
  padding: var(--spacing-20);
}

.fair-use-mode-card__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'fair-use-mode-card-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = cardStyles
    document.head.appendChild(style)
  }
}

