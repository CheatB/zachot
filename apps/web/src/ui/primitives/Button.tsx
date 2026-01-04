/**
 * Button component
 * Premium micro-interactions with framer-motion
 * Accessible, responsive, token-based
 */

import { motion, type HTMLMotionProps, useReducedMotion } from 'framer-motion'
import { forwardRef } from 'react'
import clsx from 'clsx'
import { motion as motionTokens } from '@/design-tokens'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading
    const shouldReduceMotion = useReducedMotion()

    return (
      <motion.button
        ref={ref}
        className={clsx('ui-button', `ui-button--${variant}`, `ui-button--${size}`, className)}
        disabled={isDisabled}
        whileHover={
          !isDisabled && !shouldReduceMotion
            ? {
                y: -1,
                transition: {
                  duration: motionTokens.duration.fast,
                  ease: motionTokens.easing.out,
                },
              }
            : undefined
        }
        whileTap={
          !isDisabled
            ? {
                y: 0,
                opacity: 0.9,
                transition: {
                  duration: motionTokens.duration.fast,
                  ease: motionTokens.easing.out,
                },
              }
            : undefined
        }
        transition={{
          duration: motionTokens.duration.fast,
          ease: motionTokens.easing.out,
        }}
        {...props}
      >
        {loading && (
          <motion.span
            className="ui-button__spinner"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.fast }}
          >
            <span className="ui-button__spinner-dot" />
            <span className="ui-button__spinner-dot" />
            <span className="ui-button__spinner-dot" />
          </motion.span>
        )}
        <motion.span
          className={clsx('ui-button__content', loading && 'ui-button__content--loading')}
          animate={{
            opacity: loading ? 0 : 1,
          }}
          transition={{ duration: motionTokens.duration.fast }}
        >
          {children}
        </motion.span>
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button

// Styles (should be in separate CSS file, but inline for demo)
const buttonStyles = `
.ui-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-8);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: box-shadow var(--motion-duration-base) ease;
  outline: none;
  box-shadow: var(--elevation-1);
}

.ui-button:hover:not(:disabled) {
  box-shadow: var(--elevation-2);
}

.ui-button:focus-visible {
  box-shadow: var(--focus-ring-offset);
}

.ui-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Variants */
.ui-button--primary {
  background-color: var(--color-accent-base);
  color: var(--color-text-inverse);
}

.ui-button--primary:hover:not(:disabled) {
  background-color: var(--color-accent-dark);
}

.ui-button--primary:disabled {
  background-color: var(--color-neutral-30);
  color: var(--color-text-disabled);
}

.ui-button--secondary {
  background-color: var(--color-neutral-20);
  color: var(--color-text-primary);
  border-color: var(--color-border-base);
}

.ui-button--secondary:hover:not(:disabled) {
  background-color: var(--color-neutral-30);
}

.ui-button--secondary:disabled {
  background-color: var(--color-neutral-20);
  color: var(--color-text-disabled);
  border-color: var(--color-border-light);
}

.ui-button--ghost {
  background-color: transparent;
  color: var(--color-text-primary);
}

.ui-button--ghost:hover:not(:disabled) {
  background-color: var(--color-neutral-20);
}

.ui-button--ghost:disabled {
  color: var(--color-text-disabled);
}

.ui-button--danger {
  background-color: var(--color-danger-base);
  color: var(--color-text-inverse);
}

.ui-button--danger:hover:not(:disabled) {
  background-color: var(--color-danger-dark);
}

.ui-button--danger:disabled {
  background-color: var(--color-neutral-30);
  color: var(--color-text-disabled);
}

/* Sizes */
.ui-button--sm {
  padding: var(--spacing-8) var(--spacing-12);
  font-size: var(--font-size-sm);
}

.ui-button--md {
  padding: var(--spacing-12) var(--spacing-20);
  font-size: var(--font-size-base);
}

.ui-button--lg {
  padding: var(--spacing-16) var(--spacing-24);
  font-size: var(--font-size-lg);
}

/* Loading spinner */
.ui-button__spinner {
  position: absolute;
  display: flex;
  gap: var(--spacing-4);
  align-items: center;
  justify-content: center;
}

.ui-button__spinner-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: currentColor;
  animation: button-spinner 1.4s infinite ease-in-out;
}

.ui-button__spinner-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.ui-button__spinner-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes button-spinner {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.ui-button__content--loading {
  opacity: 0;
}
`

// Inject styles (in production, use CSS modules or styled-components)
if (typeof document !== 'undefined') {
  const styleId = 'ui-button-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = buttonStyles
    document.head.appendChild(style)
  }
}

