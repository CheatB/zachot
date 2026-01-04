/**
 * Progress component
 * Determinate progress bar (0-100)
 */

import { forwardRef } from 'react'
import clsx from 'clsx'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number // 0-100
  label?: string
  showValue?: boolean
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, label, showValue = false, className, ...props }, ref) => {
    const clampedValue = Math.max(0, Math.min(100, value))
    const percentage = `${clampedValue}%`

    return (
      <div ref={ref} className={clsx('ui-progress-wrapper', className)} {...props}>
        {(label || showValue) && (
          <div className="ui-progress__header">
            {label && <span className="ui-progress__label">{label}</span>}
            {showValue && <span className="ui-progress__value">{percentage}</span>}
          </div>
        )}
        <div className="ui-progress" role="progressbar" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100}>
          <div className="ui-progress__bar" style={{ width: percentage }} />
        </div>
      </div>
    )
  }
)

Progress.displayName = 'Progress'

export default Progress

const progressStyles = `
.ui-progress-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.ui-progress__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ui-progress__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.ui-progress__value {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.ui-progress {
  width: 100%;
  height: 8px;
  background-color: var(--color-neutral-20);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.ui-progress__bar {
  height: 100%;
  background-color: var(--color-accent-base);
  border-radius: var(--radius-full);
  transition: width var(--motion-duration-base) ease;
}
`

if (typeof document !== 'undefined') {
  const styleId = 'ui-progress-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = progressStyles
    document.head.appendChild(style)
  }
}


