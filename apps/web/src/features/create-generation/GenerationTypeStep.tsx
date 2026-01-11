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

const typeOptions: (GenerationTypeOption & { illustration?: string; illustrationOffsetLeft?: number })[] = [
  {
    type: 'text',
    title: 'Текстовая работа',
    description: 'Любой вид работы с реальными источниками, оформлением по ГОСТу и защитой от проверки на ИИ',
    icon: '',
    illustration: '/assets/illustrations/text-work.webp',
    illustrationOffsetLeft: 10 // Сдвинуто еще на 5 пикселей влево (итого 10)
  },
  {
    type: 'presentation',
    title: 'Презентация',
    description: 'Презентации по заданной теме в разных стилях оформления',
    icon: '',
    illustration: '/assets/illustrations/presentation.webp'
  },
  {
    type: 'task',
    title: 'Решение задач',
    description: 'Разберись, как решать задачки по вышке, химии или экономике. Больше 100+ предметов',
    icon: '',
    illustration: '/assets/illustrations/tasks.webp'
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
      style={{ width: '100%' }}
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
            textAlign: 'left'
          }}
        >
          С чего начнём?
        </h2>
        <p
          className="wizard-step__subtitle"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: '78px',
            lineHeight: 'var(--line-height-relaxed)',
            textAlign: 'left'
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
                  option.type === 'presentation' && 'wizard-type-card--presentation',
                  option.type === 'text' && 'wizard-type-card--text',
                  option.type === 'task' && 'wizard-type-card--task'
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
                  <div 
                    className="wizard-type-card__illustration"
                    style={option.illustrationOffsetLeft ? { right: `${-15 + option.illustrationOffsetLeft}px` } : undefined}
                  >
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
  gap: var(--spacing-32);
  max-width: 1800px;
  margin: 0;
  width: 100%;
  padding: 0;
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
  min-height: 275px; /* Увеличено на 10px (было 265px) */
  padding: var(--spacing-24) var(--spacing-8);
  background: #ffffff !important;
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-xl);
  text-align: center;
  cursor: pointer;
  transition: all var(--motion-duration-base) var(--motion-easing-out);
  box-shadow: var(--elevation-1);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
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
  gap: var(--spacing-4);
  max-width: 85%;
  height: 100%;
}

.wizard-type-card__title {
  font-size: calc(var(--font-size-lg) + 6px); /* Увеличено еще на 3 пикселя (итого +6 от базы) */
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  margin-top: 0;
  min-height: 2.4em;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.wizard-type-card__description {
  font-size: calc(var(--font-size-xs) + 4px);
  color: var(--color-text-secondary);
  line-height: 1.3;
}

.wizard-type-card__illustration {
  position: absolute;
  bottom: -15px;
  right: -15px;
  width: 160px;
  height: 160px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  pointer-events: none;
  z-index: 1;
}

.wizard-type-card--presentation .wizard-type-card__illustration,
.wizard-type-card--task .wizard-type-card__illustration {
  bottom: -29px;
}

.wizard-type-card__illustration img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  opacity: 0;
  animation: illustration-fade-in 0.8s ease-out forwards;
}

@keyframes illustration-fade-in {
  from { opacity: 0; transform: scale(0.9) translate(5px, 5px); }
  to { opacity: 1; transform: scale(1) translate(0, 0); }
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
