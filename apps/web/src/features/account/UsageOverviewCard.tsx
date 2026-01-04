/**
 * UsageOverviewCard component
 * Карточка с обзором использования (токены и стоимость)
 */

import { motion, useReducedMotion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Progress, Tooltip } from '@/ui'
import type { UsageInfo } from './types'

interface UsageOverviewCardProps {
  usage: UsageInfo
}

function UsageOverviewCard({ usage }: UsageOverviewCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const tokensPercentage = Math.min((usage.tokensUsed / usage.tokensLimit) * 100, 100)
  const costPercentage = Math.min((usage.costRub / usage.costLimitRub) * 100, 100)

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ru-RU').format(num)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
        delay: 0.1,
      }}
    >
      <Card>
        <div className="usage-overview-card">
          <div className="usage-overview-card__header">
            <h3
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              Использование
            </h3>
            <Tooltip content="Мы показываем примерные значения. Фактическое потребление может немного отличаться.">
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  cursor: 'help',
                }}
              >
                ℹ️
              </span>
            </Tooltip>
          </div>

          <div className="usage-overview-card__section">
            <div className="usage-overview-card__label">
              <span
                style={{
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Токены
              </span>
            </div>
            <Progress value={tokensPercentage} />
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--spacing-8)',
              }}
            >
              Использовано {formatNumber(usage.tokensUsed)} из {formatNumber(usage.tokensLimit)} токенов
            </p>
          </div>

          <div className="usage-overview-card__section">
            <div className="usage-overview-card__label">
              <span
                style={{
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Стоимость
              </span>
            </div>
            <Progress value={costPercentage} />
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--spacing-8)',
              }}
            >
              Потрачено {usage.costRub.toFixed(2)} ₽ из {usage.costLimitRub} ₽
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default UsageOverviewCard

const cardStyles = `
.usage-overview-card {
  padding: var(--spacing-20);
}

.usage-overview-card__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-8);
  margin-bottom: var(--spacing-24);
}

.usage-overview-card__section {
  margin-bottom: var(--spacing-24);
}

.usage-overview-card__section:last-child {
  margin-bottom: 0;
}

.usage-overview-card__label {
  margin-bottom: var(--spacing-8);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'usage-overview-card-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = cardStyles
    document.head.appendChild(style)
  }
}

