/**
 * Skeleton component
 * Loading placeholder with shimmer effect (CSS-only)
 */

import { forwardRef } from 'react'
import clsx from 'clsx'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  circle?: boolean
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ width, height, circle, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('ui-skeleton', circle && 'ui-skeleton--circle', className)}
        style={{ width, height, ...style }}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

export default Skeleton

const skeletonStyles = `
.ui-skeleton {
  background: linear-gradient(
    90deg,
    var(--color-neutral-20) 0%,
    var(--color-neutral-30) 50%,
    var(--color-neutral-20) 100%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-md);
  animation: skeleton-shimmer 1.5s infinite;
}

.ui-skeleton--circle {
  border-radius: var(--radius-full);
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'ui-skeleton-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = skeletonStyles
    document.head.appendChild(style)
  }
}


