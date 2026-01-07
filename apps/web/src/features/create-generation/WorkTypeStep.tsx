/**
 * WorkTypeStep
 * Шаг 1.1: Выбор типа академической работы
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { workTypeConfigs, type WorkType } from './types'
import clsx from 'clsx'

interface WorkTypeStepProps {
  selectedWorkType: WorkType | null
  onSelect: (type: WorkType) => void
}

function WorkTypeStep({ selectedWorkType, onSelect }: WorkTypeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
      }}
    >
      <div className="wizard-step">
        <div className="work-type-grid">
          {Object.values(workTypeConfigs).map((config) => {
            const isSelected = selectedWorkType === config.id
            return (
              <motion.button
                key={config.id}
                className={clsx('work-type-card', isSelected && 'work-type-card--selected')}
                onClick={() => onSelect(config.id)}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                transition={{
                  duration: motionTokens.duration.fast,
                  ease: motionTokens.easing.out,
                }}
              >
                <div className="work-type-card__title">{config.label}</div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export default WorkTypeStep

const stepStyles = `
.work-type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-12);
  justify-content: center;
}

.work-type-card {
  padding: var(--spacing-12) var(--spacing-24);
  background-color: var(--color-accent-light);
  border: 1px solid var(--color-accent-base);
  border-radius: var(--radius-full);
  text-align: center;
  cursor: pointer;
  transition: all var(--motion-duration-base) ease;
  min-width: 160px;
}

.work-type-card:hover {
  background-color: var(--color-accent-base);
  color: var(--color-text-inverse);
}

.work-type-card--selected {
  background-color: var(--color-accent-base);
  color: var(--color-text-inverse);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
}

.work-type-card__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: inherit;
}
`

if (typeof document !== 'undefined') {
  const styleId = 'work-type-step-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = stepStyles
    document.head.appendChild(style)
  }
}


