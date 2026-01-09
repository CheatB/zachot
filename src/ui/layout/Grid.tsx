/**
 * Grid component
 * Simple responsive grid
 */

import { forwardRef } from 'react'
import clsx from 'clsx'

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ cols = 3, gap = 'md', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('ui-grid', `ui-grid--cols-${cols}`, `ui-grid--gap-${gap}`, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Grid.displayName = 'Grid'

export default Grid

const gridStyles = `
.ui-grid {
  display: grid;
  width: 100%;
}

.ui-grid--gap-xs {
  gap: var(--spacing-xs);
}

.ui-grid--gap-sm {
  gap: var(--spacing-sm);
}

.ui-grid--gap-md {
  gap: var(--spacing-md);
}

.ui-grid--gap-lg {
  gap: var(--spacing-lg);
}

.ui-grid--gap-xl {
  gap: var(--spacing-xl);
}

.ui-grid--cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.ui-grid--cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ui-grid--cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.ui-grid--cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.ui-grid--cols-6 {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.ui-grid--cols-12 {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

@media (max-width: 768px) {
  .ui-grid--cols-2,
  .ui-grid--cols-3,
  .ui-grid--cols-4,
  .ui-grid--cols-6,
  .ui-grid--cols-12 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .ui-grid--cols-3,
  .ui-grid--cols-4,
  .ui-grid--cols-6,
  .ui-grid--cols-12 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'ui-grid-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = gridStyles
    document.head.appendChild(style)
  }
}


