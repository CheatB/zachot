/**
 * CapabilitiesCard component
 * Карточка с доступными возможностями
 */

import { motion, useReducedMotion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card } from '@/ui'
import type { Capabilities } from './types'

interface CapabilitiesCardProps {
  capabilities: Capabilities
}

function CapabilitiesCard({ capabilities }: CapabilitiesCardProps) {
  const getPriorityLabel = (priority: Capabilities['priority']): string => {
    switch (priority) {
      case 'high':
        return 'Высокий'
      case 'normal':
        return 'Обычный'
      case 'low':
        return 'Низкий'
      default:
        return priority
    }
  }

  const items = [
    {
      label: 'Потоковая генерация',
      value: capabilities.streamingAvailable ? 'Доступна' : 'Недоступна',
      available: capabilities.streamingAvailable,
    },
    {
      label: 'Максимум токенов на запрос',
      value: `${capabilities.maxTokensPerRequest.toLocaleString('ru-RU')}`,
      available: true,
    },
    {
      label: 'Приоритет обработки',
      value: getPriorityLabel(capabilities.priority),
      available: true,
    },
    {
      label: 'Сохранение результатов',
      value: capabilities.resultPersistence ? 'Включено' : 'Выключено',
      available: capabilities.resultPersistence,
    },
  ]

  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
        delay: 0.3,
      }}
    >
      <Card>
        <div className="capabilities-card">
          <h3
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-20)',
            }}
          >
            Доступные возможности
          </h3>
          <ul className="capabilities-card__list">
            {items.map((item, index) => (
              <li key={index} className="capabilities-card__item">
                <div className="capabilities-card__label">
                  <span
                    style={{
                      fontSize: 'var(--font-size-base)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                <div className="capabilities-card__value">
                  <span
                    style={{
                      fontSize: 'var(--font-size-base)',
                      color: item.available
                        ? 'var(--color-text-secondary)'
                        : 'var(--color-text-muted)',
                      fontWeight: item.available
                        ? 'var(--font-weight-medium)'
                        : 'var(--font-weight-normal)',
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </motion.div>
  )
}

export default CapabilitiesCard

const cardStyles = `
.capabilities-card {
  padding: var(--spacing-20);
}

.capabilities-card__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
  list-style: none;
  padding: 0;
  margin: 0;
}

.capabilities-card__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-12) 0;
  border-bottom: 1px solid var(--color-border-light);
}

.capabilities-card__item:last-child {
  border-bottom: none;
}

.capabilities-card__label {
  flex: 1;
}

.capabilities-card__value {
  flex-shrink: 0;
  margin-left: var(--spacing-16);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'capabilities-card-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = cardStyles
    document.head.appendChild(style)
  }
}

