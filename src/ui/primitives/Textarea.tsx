/**
 * Textarea component
 * Similar to Input but for multi-line text
 */

import { forwardRef } from 'react'
import clsx from 'clsx'
import { generateId } from '@/utils/a11y'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const textareaId = id || generateId('textarea')
    const hintId = hint ? `${textareaId}-hint` : undefined
    const errorId = error ? `${textareaId}-error` : undefined
    const ariaDescribedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

    return (
      <div className={clsx('ui-textarea-wrapper', className)}>
        {label && (
          <label htmlFor={textareaId} className="ui-textarea__label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx('ui-textarea', error && 'ui-textarea--error')}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={ariaDescribedBy}
          {...props}
        />
        {hint && !error && (
          <div id={hintId} className="ui-textarea__hint">
            {hint}
          </div>
        )}
        {error && (
          <div id={errorId} className="ui-textarea__error" role="alert">
            {error}
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea

const textareaStyles = `
.ui-textarea-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.ui-textarea__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.ui-textarea {
  width: 100%;
  min-height: 120px;
  padding: var(--spacing-12) var(--spacing-16);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-surface-base);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-md);
  outline: none;
  resize: vertical;
  transition: all var(--motion-duration-base) ease;
}

.ui-textarea:focus {
  border-color: var(--color-accent-base);
  box-shadow: var(--focus-ring-offset);
}

.ui-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--color-neutral-20);
}

.ui-textarea--error {
  border-color: var(--color-danger-base);
}

.ui-textarea__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.ui-textarea__error {
  font-size: var(--font-size-sm);
  color: var(--color-danger-base);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'ui-textarea-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = textareaStyles
    document.head.appendChild(style)
  }
}


