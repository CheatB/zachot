/**
 * ProgressSteps component
 * Анимированный индикатор прогресса (step-based)
 */

import { motion, useReducedMotion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import type { ProgressStep } from './types'

interface ProgressStepsProps {
  steps: ProgressStep[]
  currentStepIndex: number
}

function ProgressSteps({ steps, currentStepIndex }: ProgressStepsProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="progress-steps">
      <div className="progress-steps__list" aria-live="polite" aria-atomic="true">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex
          const isCompleted = index < currentStepIndex
          const isUpcoming = index > currentStepIndex

          return (
            <motion.div
              key={step.id}
              className="progress-steps__item"
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: motionTokens.duration.base,
                ease: motionTokens.easing.out,
              }}
            >
              <div className="progress-steps__indicator">
                <div
                  className={[
                    'progress-steps__dot',
                    isActive && 'progress-steps__dot--active',
                    isCompleted && 'progress-steps__dot--completed',
                    isUpcoming && 'progress-steps__dot--upcoming',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isCompleted && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: motionTokens.duration.fast,
                        ease: motionTokens.easing.out,
                      }}
                    >
                      ✓
                    </motion.span>
                  )}
                  {isActive && !shouldReduceMotion && (
                    <motion.div
                      className="progress-steps__pulse"
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.4, 0.7, 0.4],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: motionTokens.easing.inOut,
                      }}
                    />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={[
                      'progress-steps__line',
                      isCompleted && 'progress-steps__line--completed',
                      isActive && 'progress-steps__line--active',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                )}
              </div>
              <div className="progress-steps__content">
                <h3
                  className={[
                    'progress-steps__label',
                    isActive && 'progress-steps__label--active',
                    isCompleted && 'progress-steps__label--completed',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {step.label}
                </h3>
                {step.description && isActive && (
                  <motion.p
                    className="progress-steps__description"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {step.description}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default ProgressSteps

const progressStepsStyles = `
.progress-steps {
  width: 100%;
}

.progress-steps__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-24);
}

.progress-steps__item {
  display: flex;
  gap: var(--spacing-20);
  align-items: flex-start;
}

.progress-steps__indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.progress-steps__dot {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background-color: var(--color-neutral-20);
  border: 2px solid var(--color-border-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
  position: relative;
  transition: all var(--motion-duration-base) ease;
}

.progress-steps__dot--active {
  background-color: var(--color-accent-light);
  border-color: var(--color-accent-base);
  color: var(--color-accent-base);
  font-weight: var(--font-weight-semibold);
}

.progress-steps__dot--completed {
  background-color: var(--color-success-light);
  border-color: var(--color-success-base);
  color: var(--color-success-base);
}

.progress-steps__dot--upcoming {
  background-color: var(--color-neutral-20);
  border-color: var(--color-border-base);
  color: var(--color-text-disabled);
}

.progress-steps__pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: var(--radius-full);
  background-color: var(--color-accent-base);
  opacity: 0.3;
  pointer-events: none;
}

.progress-steps__line {
  width: 2px;
  height: 60px;
  background-color: var(--color-border-base);
  margin-top: var(--spacing-8);
  transition: all var(--motion-duration-base) ease;
}

.progress-steps__line--completed {
  background-color: var(--color-success-base);
}

.progress-steps__line--active {
  background-color: var(--color-accent-base);
  opacity: 0.5;
}

.progress-steps__content {
  flex: 1;
  padding-top: var(--spacing-8);
}

.progress-steps__label {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-4);
  transition: color var(--motion-duration-base) ease;
}

.progress-steps__label--active {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.progress-steps__label--completed {
  color: var(--color-text-secondary);
}

.progress-steps__description {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  line-height: var(--line-height-relaxed);
  margin-top: var(--spacing-8);
}

@media (max-width: 768px) {
  .progress-steps__item {
    gap: var(--spacing-16);
  }
  
  .progress-steps__dot {
    width: 32px;
    height: 32px;
    font-size: var(--font-size-base);
  }
  
  .progress-steps__line {
    height: 40px;
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'progress-steps-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = progressStepsStyles
    document.head.appendChild(style)
  }
}

