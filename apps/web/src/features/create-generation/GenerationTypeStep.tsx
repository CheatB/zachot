/**
 * GenerationTypeStep
 * Шаг 1: Выбор типа работы
 * Updated for "juicy" landing page aesthetic
 */

import { motion } from 'framer-motion'
import { useEffect } from 'react'
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
    description: 'Любой вид работы с реальными источниками, оформлением по ГОСТу и защитой от проверки на ИИ',
    icon: '',
    illustration: '/assets/illustrations/text-work.png'
  },
  {
    type: 'presentation',
    title: 'Подготовить презентацию',
    description: 'Презентации по заданной теме в разных стилях оформления',
    icon: '',
    illustration: '/assets/illustrations/presentation.png'
  },
  {
    type: 'task',
    title: 'Решить задачу',
    description: 'Разберись, как решать задачки по вышке, химии или экономике. Больше 100+ предметов',
    icon: '',
  },
]

function GenerationTypeStep({ selectedType, onSelect }: GenerationTypeStepProps) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'wizard-type-step-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = stepStyles
    }
  }, [])

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
                className={clsx(
                  'wizard-type-card', 
                  isSelected && 'wizard-type-card--selected',
                  option.type === 'presentation' && 'wizard-type-card--presentation'
                )}
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
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-24);
  max-width: 1320px; /* Растянуто на 20% от базы 1100px */
  margin: 0 auto;
  padding: 0 var(--spacing-8); /* Уменьшено расстояние от боковых краев контейнера */
}

@media (max-width: 1024px) {
  .wizard-type-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
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
  min-height: 200px;
  padding: var(--spacing-24) var(--spacing-8); /* Боковые отступы внутри уменьшены вдвое */
  background: #ffffff !important;
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-xl);
  text-align: left;
  cursor: pointer;
  transition: all var(--motion-duration-base) var(--motion-easing-out);
  box-shadow: var(--elevation-1);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  isolation: isolate;
}

.wizard-type-card:hover {
  box-shadow: var(--elevation-3);
  border-color: var(--color-accent-base);
  transform: translateY(-4px);
  background: var(--color-neutral-10);
}

.wizard-type-card--selected {
  border-color: var(--color-accent-base);
  background: var(--color-accent-light) !important;
  box-shadow: 0 10px 30px rgba(22, 163, 74, 0.1);
}

.wizard-type-card__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
  max-width: 70%;
  height: 100%;
}

.wizard-type-card__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  margin-top: 0;
  min-height: 3.2em; /* Выравнивание заголовков на одном уровне */
  display: flex;
  align-items: flex-start;
}

.wizard-type-card__description {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.3;
}

.wizard-type-card__illustration {
  position: absolute;
  bottom: -15px;
  right: -15px;
  width: 150px;
  height: 150px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  pointer-events: none;
  z-index: 1;
}

/* Опускаем иллюстрацию во втором блоке на 5+3 = 8 пикселей суммарно */
.wizard-type-card--presentation .wizard-type-card__illustration {
  bottom: -23px;
}

.wizard-type-card__illustration img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.wizard-type-card__check {
  position: absolute;
  top: var(--spacing-16);
  right: var(--spacing-16);
  width: 24px;
  height: 24px;
  background: var(--color-accent-base);
  color: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 4px 10px var(--color-accent-shadow);
  z-index: 3;
}
`
