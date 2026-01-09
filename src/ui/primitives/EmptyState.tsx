/**
 * EmptyState component
 * Empty state with title, description, optional action
 */

import { forwardRef } from 'react'
import clsx from 'clsx'
import Button from './Button'

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ title, description, action, className, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('ui-empty-state', className)} {...props}>
        <div className="ui-empty-state__content">
          <h3 className="ui-empty-state__title">{title}</h3>
          {description && <p className="ui-empty-state__description">{description}</p>}
          {action && (
            <Button variant="primary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      </div>
    )
  }
)

EmptyState.displayName = 'EmptyState'

export default EmptyState

const emptyStateStyles = `
.ui-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: var(--spacing-32);
  text-align: center;
}

.ui-empty-state__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-16);
  max-width: 400px;
}

.ui-empty-state__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.ui-empty-state__description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'ui-empty-state-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = emptyStateStyles
    document.head.appendChild(style)
  }
}


