/**
 * Card component
 * Surface with border and elevation
 * Updated for a "juicy" landing page feel
 */

import { forwardRef } from 'react'
import clsx from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'pricing'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ header, children, className, variant = 'default', ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('ui-card', `ui-card--${variant}`, className)} {...props}>
        {header && <div className="ui-card__header">{header}</div>}
        <div className="ui-card__content">{children}</div>
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card

const cardStyles = `
.ui-card {
  background-color: var(--color-surface-base);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--elevation-2);
  overflow: hidden;
  transition: all var(--motion-duration-slow) var(--motion-easing-out);
}

.ui-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--elevation-3);
  border-color: var(--color-accent-base);
}

.ui-card--elevated {
  box-shadow: var(--elevation-3);
}

.ui-card--pricing {
  border-radius: var(--radius-xl);
  box-shadow: var(--elevation-4);
  border-width: 2px;
}

.ui-card__header {
  padding: var(--spacing-24);
  border-bottom: 1px solid var(--color-border-light);
}

.ui-card__content {
  padding: var(--spacing-24);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'ui-card-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = cardStyles
    document.head.appendChild(style)
  }
}
