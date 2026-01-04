/**
 * Container component
 * Max-width container with responsive padding
 */

import { forwardRef } from 'react'
import clsx from 'clsx'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: React.ReactNode
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = 'lg', className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('ui-container', `ui-container--${size}`, className)} {...props}>
        {children}
      </div>
    )
  }
)

Container.displayName = 'Container'

export default Container

const containerStyles = `
.ui-container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--spacing-16);
  padding-right: var(--spacing-16);
}

@media (min-width: 768px) {
  .ui-container {
    padding-left: var(--spacing-24);
    padding-right: var(--spacing-24);
  }
}

.ui-container--sm {
  max-width: 640px;
}

.ui-container--md {
  max-width: 768px;
}

.ui-container--lg {
  max-width: 1024px;
}

.ui-container--xl {
  max-width: 1280px;
}

.ui-container--full {
  max-width: 100%;
}
`

if (typeof document !== 'undefined') {
  const styleId = 'ui-container-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = containerStyles
    document.head.appendChild(style)
  }
}


