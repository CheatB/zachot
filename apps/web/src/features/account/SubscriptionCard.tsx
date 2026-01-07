/**
 * SubscriptionCard component
 * Карточка с информацией о подписке
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Badge, Button, Tooltip } from '@/ui'
import type { SubscriptionInfo } from './types'
import { formatDate } from '@/utils/format'

interface SubscriptionCardProps {
  subscription: SubscriptionInfo
}

function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const getStatusLabel = (status: SubscriptionInfo['status']): string => {
    switch (status) {
      case 'active':
        return 'Активна'
      case 'expiring':
        return 'Истекает'
      case 'paused':
        return 'Приостановлена'
      default:
        return status
    }
  }

  const getStatusBadgeType = (status: SubscriptionInfo['status']): 'success' | 'warn' | 'neutral' => {
    switch (status) {
      case 'active':
        return 'success'
      case 'expiring':
        return 'warn'
      case 'paused':
        return 'neutral'
      default:
        return 'neutral'
    }
  }

  const getNextDateLabel = (): string => {
    if (subscription.nextBillingDate) {
      return `Следующее списание: ${formatDate(subscription.nextBillingDate)}`
    }
    if (subscription.expirationDate) {
      return `Истекает: ${formatDate(subscription.expirationDate)}`
    }
    return ''
  }

  const shouldReduceMotion = false

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
      }}
    >
      <motion.div
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
        className="subscription-card-wrapper"
      >
        <Card>
        <div className="subscription-card">
          <div className="subscription-card__header">
            <div>
              <h3
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-8)',
                }}
              >
                {subscription.planName}
              </h3>
              <Badge status={getStatusBadgeType(subscription.status)}>
                {getStatusLabel(subscription.status)}
              </Badge>
            </div>
            <div className="subscription-card__price">
              <span
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {subscription.monthlyPriceRub} ₽
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                }}
              >
                / месяц
              </span>
            </div>
          </div>

          {getNextDateLabel() && (
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--spacing-16)',
                marginBottom: 'var(--spacing-20)',
              }}
            >
              {getNextDateLabel()}
            </p>
          )}

          <div className="subscription-card__actions">
            <Tooltip content="Функция будет доступна позже">
              <Button variant="primary" disabled>
                Управление подпиской
              </Button>
            </Tooltip>
            <Tooltip content="Функция будет доступна позже">
              <Button variant="secondary" disabled>
                Сменить тариф
              </Button>
            </Tooltip>
          </div>
        </div>
      </Card>
      </motion.div>
    </motion.div>
  )
}

export default SubscriptionCard

const cardStyles = `
.subscription-card-wrapper {
  transition: box-shadow var(--motion-duration-base) ease;
}

@media (hover: hover) and (pointer: fine) {
  .subscription-card-wrapper:hover {
    box-shadow: var(--elevation-2);
  }
}

.subscription-card {
  padding: var(--spacing-20);
}

.subscription-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-16);
}

.subscription-card__price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-4);
}

.subscription-card__actions {
  display: flex;
  gap: var(--spacing-12);
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .subscription-card__header {
    flex-direction: column;
    gap: var(--spacing-16);
  }
  
  .subscription-card__price {
    align-items: flex-start;
  }
  
  .subscription-card__actions {
    flex-direction: column;
  }
  
  .subscription-card__actions button {
    width: 100%;
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'subscription-card-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = cardStyles
    document.head.appendChild(style)
  }
}

