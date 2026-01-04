/**
 * Stack component
 * Vertical/horizontal spacing using tokens
 */

import { forwardRef } from 'react'
import clsx from 'clsx'

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column'
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around'
  children: React.ReactNode
}

const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ direction = 'column', gap = 'md', align, justify, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'ui-stack',
          `ui-stack--${direction}`,
          `ui-stack--gap-${gap}`,
          align && `ui-stack--align-${align}`,
          justify && `ui-stack--justify-${justify}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Stack.displayName = 'Stack'

export default Stack

const stackStyles = `
.ui-stack {
  display: flex;
}

.ui-stack--row {
  flex-direction: row;
}

.ui-stack--column {
  flex-direction: column;
}

.ui-stack--gap-xs {
  gap: var(--spacing-xs);
}

.ui-stack--gap-sm {
  gap: var(--spacing-sm);
}

.ui-stack--gap-md {
  gap: var(--spacing-md);
}

.ui-stack--gap-lg {
  gap: var(--spacing-lg);
}

.ui-stack--gap-xl {
  gap: var(--spacing-xl);
}

.ui-stack--gap-2xl {
  gap: var(--spacing-2xl);
}

.ui-stack--gap-3xl {
  gap: var(--spacing-3xl);
}

.ui-stack--align-start {
  align-items: flex-start;
}

.ui-stack--align-center {
  align-items: center;
}

.ui-stack--align-end {
  align-items: flex-end;
}

.ui-stack--align-stretch {
  align-items: stretch;
}

.ui-stack--justify-start {
  justify-content: flex-start;
}

.ui-stack--justify-center {
  justify-content: center;
}

.ui-stack--justify-end {
  justify-content: flex-end;
}

.ui-stack--justify-space-between {
  justify-content: space-between;
}

.ui-stack--justify-space-around {
  justify-content: space-around;
}
`

if (typeof document !== 'undefined') {
  const styleId = 'ui-stack-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = stackStyles
    document.head.appendChild(style)
  }
}


