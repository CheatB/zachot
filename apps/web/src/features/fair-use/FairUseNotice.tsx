/**
 * FairUseNotice component
 * Мягкое уведомление о fair use режиме
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Button } from '@/ui'

export type FairUseMode = 'degraded' | 'strict'

interface FairUseNoticeProps {
  mode: FairUseMode
  onSimplify?: () => void
  onBack?: () => void
}

function FairUseNotice({ mode, onSimplify, onBack }: FairUseNoticeProps) {
  // Degraded mode: info banner
  if (mode === 'degraded') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: motionTokens.duration.base,
          ease: motionTokens.easing.out,
        }}
      >
        <Card className="fair-use-notice fair-use-notice--degraded">
          <div className="fair-use-notice__content">
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-relaxed)',
                margin: 0,
              }}
            >
              Сейчас мы временно применяем более щадящий режим обработки.
            </p>
          </div>
        </Card>
      </motion.div>
    )
  }

  // Strict mode: recovery-like screen
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
      }}
    >
      <Card className="fair-use-notice fair-use-notice--strict">
        <div className="fair-use-notice__content">
          <h3
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-12)',
            }}
          >
            Временное ограничение
          </h3>
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-relaxed)',
              marginBottom: 'var(--spacing-20)',
            }}
          >
            Попробуйте позже или упростите запрос.
          </p>
          <div className="fair-use-notice__actions">
            {onSimplify && (
              <Button variant="primary" onClick={onSimplify}>
                Упростить запрос
              </Button>
            )}
            {onBack && (
              <Button variant="secondary" onClick={onBack}>
                Вернуться к списку
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default FairUseNotice

const noticeStyles = `
.fair-use-notice {
  background-color: var(--color-neutral-20);
  border: 1px solid var(--color-border-light);
}

.fair-use-notice--degraded {
  padding: var(--spacing-20);
}

.fair-use-notice--strict {
  padding: var(--spacing-24);
}

.fair-use-notice__content {
  width: 100%;
}

.fair-use-notice__actions {
  display: flex;
  gap: var(--spacing-16);
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .fair-use-notice__actions {
    flex-direction: column;
  }
  
  .fair-use-notice__actions button {
    width: 100%;
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'fair-use-notice-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = noticeStyles
    document.head.appendChild(style)
  }
}


