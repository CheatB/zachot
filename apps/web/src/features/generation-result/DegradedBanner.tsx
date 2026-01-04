/**
 * DegradedBanner component
 * Баннер для упрощённого режима генерации
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Badge } from '@/ui'

interface DegradedBannerProps {
  onContinue?: () => void
  onNewGeneration?: () => void
}

function DegradedBanner(_props: DegradedBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
      }}
    >
      <Card className="degraded-banner">
        <div className="degraded-banner__content">
          <div className="degraded-banner__header">
            <Badge status="neutral">Упрощённый режим</Badge>
          </div>
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-relaxed)',
              marginTop: 'var(--spacing-12)',
            }}
          >
            Результат подготовлен в упрощённом режиме, чтобы вы всё равно получили пользу.
          </p>
        </div>
      </Card>
    </motion.div>
  )
}

export default DegradedBanner

const bannerStyles = `
.degraded-banner {
  background-color: var(--color-neutral-20);
  border: 1px solid var(--color-border-light);
}

.degraded-banner__content {
  padding: var(--spacing-20);
}

.degraded-banner__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'degraded-banner-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = bannerStyles
    document.head.appendChild(style)
  }
}

