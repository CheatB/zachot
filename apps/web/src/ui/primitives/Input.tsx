/**
 * Input component
 * Accessible, with label, hint, error, prefix/suffix
 */

import { forwardRef } from 'react'
import clsx from 'clsx'
import { generateId } from '@/utils/a11y'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  hint?: string
  error?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, prefix, suffix, className, id, ...props }, ref) => {
    const inputId = id || generateId('input')
    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const ariaDescribedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

    return (
      <div className={clsx('ui-input-wrapper', className)}>
        {label && (
          <label htmlFor={inputId} className="ui-input__label">
            {label}
          </label>
        )}
        <div className={clsx('ui-input-container', error && 'ui-input-container--error')}>
          {prefix && <span className="ui-input__prefix">{prefix}</span>}
          <input
            ref={ref}
            id={inputId}
            className={clsx('ui-input', prefix && 'ui-input--with-prefix', suffix && 'ui-input--with-suffix')}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={ariaDescribedBy}
            {...props}
          />
          {suffix && <span className="ui-input__suffix">{suffix}</span>}
        </div>
        {hint && !error && (
          <div id={hintId} className="ui-input__hint">
            {hint}
          </div>
        )}
        {error && (
          <div id={errorId} className="ui-input__error" role="alert">
            {error}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

const inputStyles = `
.ui-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.ui-input__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.ui-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.ui-input {
  width: 100%;
  padding: var(--spacing-12) var(--spacing-16);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-surface-base);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-md);
  outline: none;
  transition: all var(--motion-duration-base) ease;
}

.ui-input:focus {
  border-color: var(--color-accent-base);
  box-shadow: var(--focus-ring-offset);
}

.ui-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--color-neutral-20);
}

.ui-input-container--error .ui-input {
  border-color: var(--color-danger-base);
}

.ui-input--with-prefix {
  padding-left: var(--spacing-40);
}

.ui-input--with-suffix {
  padding-right: var(--spacing-40);
}

.ui-input__prefix,
.ui-input__suffix {
  position: absolute;
  display: flex;
  align-items: center;
  color: var(--color-text-muted);
  pointer-events: none;
}

.ui-input__prefix {
  left: var(--spacing-16);
}

.ui-input__suffix {
  right: var(--spacing-16);
}

.ui-input__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.ui-input__error {
  font-size: var(--font-size-sm);
  color: var(--color-danger-base);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'ui-input-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = inputStyles
    document.head.appendChild(style)
  }
}

