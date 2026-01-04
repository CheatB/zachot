/**
 * Badge component
 * Status indicators: neutral/success/warn/danger
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { forwardRef } from 'react'
import clsx from 'clsx'

type BadgeStatus = 'neutral' | 'success' | 'warn' | 'danger'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus
  children: React.ReactNode
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ status = 'neutral', className, children, ...props }, ref) => {
    return (
      <motion.span
        ref={ref}
        className={clsx('ui-badge', `ui-badge--${status}`, className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: motionTokens.duration.fast,
          ease: motionTokens.easing.out,
        }}
        {...(props as any)}
      >
        {children}
      </motion.span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge

const badgeStyles = `
.ui-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-8);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.ui-badge--neutral {
  background-color: var(--color-neutral-20);
  color: var(--color-text-secondary);
}

.ui-badge--success {
  background-color: var(--color-success-light);
  color: var(--color-success-dark);
}

.ui-badge--warn {
  background-color: var(--color-warn-light);
  color: var(--color-warn-dark);
}

.ui-badge--danger {
  background-color: var(--color-danger-light);
  color: var(--color-danger-dark);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'ui-badge-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = badgeStyles
    document.head.appendChild(style)
  }
}

