/**
 * GenerationTypeStep
 * Шаг 1: Выбор типа работы
 * Updated for "juicy" landing page aesthetic
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import type { GenerationType, GenerationTypeOption } from './types'
import clsx from 'clsx'

interface GenerationTypeStepProps {
  selectedType: GenerationType | null
  onSelect: (type: GenerationType) => void
}

const typeOptions: (GenerationTypeOption & { illustration?: string })[] = [
  {
    type: 'text',
    title: 'Создать текстовую работу',
    description: 'любой вид работы по заданной теме с реальными источниками, оформлением по ГОСТу и защитой от проверки на ИИ-генерацию',
    icon: '',
    illustration: '/assets/illustrations/text-work.png'
  },
  {
    type: 'presentation',
    title: 'Подготовить презентацию',
    description: 'презентация по заданной теме в разных стилях оформления',
    icon: '',
    illustration: '/assets/illustrations/presentation.png'
  },
  {
    type: 'task',
    title: 'Решить задачу',
    description: 'Разберись, как решать задачки по вышке, химии или экономике. Больше 100+ предметов',
    icon: '',
    illustration: '/assets/illustrations/tasks.png'
  },
]

function GenerationTypeStep({ selectedType, onSelect }: GenerationTypeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: motionTokens.duration.slow,
        ease: motionTokens.easing.out,
      }}
    >
      <div className="wizard-step">
        <h2
          className="wizard-step__title"
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-heading)',
            marginBottom: 'var(--spacing-12)',
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
            textAlign: 'center'
          }}
        >
          С чего начнём?
        </h2>
        <p
          className="wizard-step__subtitle"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-48)',
            lineHeight: 'var(--line-height-relaxed)',
            textAlign: 'center'
          }}
        >
          Выберите формат работы. На следующем шаге мы уточним тему и детали.
        </p>

        <div className="wizard-type-grid">
          {typeOptions.map((option) => {
            const isSelected = selectedType === option.type
            return (
              <motion.button
                key={option.type}
                className={clsx('wizard-type-card', isSelected && 'wizard-type-card--selected')}
                onClick={() => onSelect(option.type)}
                whileHover={{ y: -8, scale: 1.01 }}
                whileTap={{ y: 0, scale: 0.99 }}
                transition={{
                  duration: motionTokens.duration.base,
                  ease: motionTokens.easing.out,
                }}
                aria-pressed={isSelected}
                aria-label={`${option.title}: ${option.description}`}
              >
                <div className="wizard-type-card__content">
                  <h3 className="wizard-type-card__title">{option.title}</h3>
                  <p className="wizard-type-card__description">{option.description}</p>
                </div>
                
                {option.illustration && (
                  <div className="wizard-type-card__illustration">
                    <img src={option.illustration} alt="" />
                  </div>
                )}

                {isSelected && (
                  <div className="wizard-type-card__check">✓</div>
                )}
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
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--spacing-32);
}

@media (max-width: 768px) {
  .wizard-type-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-16);
  }
}

.wizard-type-card {
  position: relative;
  width: 100%;
  min-height: 380px;
  padding: var(--spacing-32);
  background-color: var(--color-surface-base);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-xl);
  text-align: center;
  cursor: pointer;
  transition: all var(--motion-duration-base) var(--motion-easing-out);
  box-shadow: var(--elevation-2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.wizard-type-card:hover {
  box-shadow: var(--elevation-3);
  border-color: var(--color-accent-base);
}

.wizard-type-card--selected {
  border-color: var(--color-accent-base);
  background-color: var(--color-accent-light);
  box-shadow: 0 20px 40px rgba(22, 163, 74, 0.1);
}

.wizard-type-card__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
}

.wizard-type-card__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.wizard-type-card__description {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.3;
  max-width: 90%;
  margin: 0 auto;
}

.wizard-type-card__illustration {
  position: absolute;
  bottom: -10px;
  right: -10px;
  width: 70%;
  height: auto;
  opacity: 0.9;
  transition: transform 0.3s var(--motion-easing-out);
  pointer-events: none;
  z-index: 1;
}

.wizard-type-card:hover .wizard-type-card__illustration {
  transform: scale(1.05) translate(-5px, -5px);
}

.wizard-type-card__illustration img {
  width: 100%;
  height: auto;
  display: block;
}

.wizard-type-card__check {
  position: absolute;
  top: var(--spacing-20);
  right: var(--spacing-20);
  width: 28px;
  height: 28px;
  background: var(--color-accent-base);
  color: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 4px 10px var(--color-accent-shadow);
  z-index: 3;
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
