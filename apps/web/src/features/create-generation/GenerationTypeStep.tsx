/**
 * GenerationTypeStep
 * Шаг 1: Выбор типа генерации
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import type { GenerationType, GenerationTypeOption } from './types'
import clsx from 'clsx'

interface GenerationTypeStepProps {
  selectedType: GenerationType | null
  onSelect: (type: GenerationType) => void
}

const typeOptions: GenerationTypeOption[] = [
  {
    type: 'text',
    title: 'Структурировать текст',
    description: 'Мы поможем аккуратно структурировать ваш материал и выделить ключевые моменты',
    icon: '📝',
  },
  {
    type: 'presentation',
    title: 'Подготовить презентацию',
    description: 'Создадим структурированную презентацию на основе вашего материала',
    icon: '📊',
  },
  {
    type: 'task',
    title: 'Решить задачу',
    description: 'Проанализируем задачу и предложим пошаговое решение',
    icon: '✅',
  },
]

function GenerationTypeStep({ selectedType, onSelect }: GenerationTypeStepProps) {
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
        <h2
          className="wizard-step__title"
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--spacing-12)',
            color: 'var(--color-text-primary)',
          }}
        >
          Что вы хотите сделать?
        </h2>
        <p
          className="wizard-step__subtitle"
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-8)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          Выберите тип генерации, который лучше всего подходит для вашей задачи
        </p>
        <p
          className="wizard-step__hint"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--spacing-32)',
            lineHeight: 'var(--line-height-relaxed)',
            fontStyle: 'italic',
          }}
        >
          Выберите формат — содержание можно будет доработать
        </p>

        <div className="wizard-type-grid">
          {typeOptions.map((option) => {
            const isSelected = selectedType === option.type
            return (
              <motion.button
                key={option.type}
                className={clsx('wizard-type-card', isSelected && 'wizard-type-card--selected')}
                onClick={() => onSelect(option.type)}
                whileHover={{ y: -4 }}
                whileTap={{ y: 0 }}
                transition={{
                  duration: motionTokens.duration.fast,
                  ease: motionTokens.easing.out,
                }}
                aria-pressed={isSelected}
                aria-label={`${option.title}: ${option.description}`}
              >
                <div className="wizard-type-card__icon">{option.icon}</div>
                <h3 className="wizard-type-card__title">{option.title}</h3>
                <p className="wizard-type-card__description">{option.description}</p>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export default GenerationTypeStep

const stepStyles = `
.wizard-step {
  width: 100%;
}

.wizard-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-24);
}

@media (max-width: 768px) {
  .wizard-type-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-16);
  }
}

.wizard-type-card {
  width: 100%;
  padding: var(--spacing-24);
  background-color: var(--color-surface-base);
  border: 2px solid var(--color-border-base);
  border-radius: var(--radius-lg);
  text-align: left;
  cursor: pointer;
  transition: all var(--motion-duration-base) ease;
  box-shadow: var(--elevation-1);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
}

.wizard-type-card:hover {
  box-shadow: var(--elevation-2);
  border-color: var(--color-border-dark);
}

.wizard-type-card:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring-offset);
}

.wizard-type-card--selected {
  border-color: var(--color-accent-base);
  background-color: var(--color-accent-light);
  box-shadow: var(--elevation-2);
}

.wizard-type-card__icon {
  font-size: var(--font-size-4xl);
  line-height: 1;
}

.wizard-type-card__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.wizard-type-card__description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'wizard-type-step-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = stepStyles
    document.head.appendChild(style)
  }
}

