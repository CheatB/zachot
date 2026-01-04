/**
 * Card component
 * Surface with border and elevation
 */

import { forwardRef } from 'react'
import clsx from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  children: React.ReactNode
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ header, children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('ui-card', className)} {...props}>
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
  box-shadow: var(--elevation-1);
  overflow: hidden;
}

.ui-card__header {
  padding: var(--spacing-20);
  border-bottom: 1px solid var(--color-border-light);
}

.ui-card__content {
  padding: var(--spacing-20);
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


