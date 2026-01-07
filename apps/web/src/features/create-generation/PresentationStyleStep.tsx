/**
 * PresentationStyleStep
 * Шаг 1.6: Выбор визуального стиля презентации
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import type { PresentationStyle } from './types'
import clsx from 'clsx'

interface PresentationStyleStepProps {
  selectedStyle: PresentationStyle | null
  onSelect: (style: PresentationStyle) => void
}

const styleOptions: { id: PresentationStyle; label: string; description: string; colors: string[] }[] = [
  { 
    id: 'academic', 
    label: 'Академический', 
    description: 'Строгий стиль, синие и серые тона, классические шрифты. Идеально для вуза.',
    colors: ['#1e3a8a', '#f8fafc', '#334155']
  },
  { 
    id: 'business', 
    label: 'Бизнес', 
    description: 'Профессиональный и чистый. Акцент на графиках и четкой структуре.',
    colors: ['#0f172a', '#ffffff', '#2563eb']
  },
  { 
    id: 'modern', 
    label: 'Современный', 
    description: 'Яркие акценты, динамичная верстка, современные гротески.',
    colors: ['#7c3aed', '#fdf2f8', '#111827']
  },
  { 
    id: 'minimalist', 
    label: 'Минимализм', 
    description: 'Максимум воздуха, минимум лишних деталей. Только главное.',
    colors: ['#000000', '#ffffff', '#71717a']
  },
]

function PresentationStyleStep({ selectedStyle, onSelect }: PresentationStyleStepProps) {
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
        <div className="presentation-style-grid">
          {styleOptions.map((option) => {
            const isSelected = selectedStyle === option.id
            return (
              <motion.button
                key={option.id}
                type="button"
                className={clsx('style-card', isSelected && 'style-card--selected')}
                onClick={() => onSelect(option.id)}
                whileHover={{ y: -4 }}
                whileTap={{ y: 0 }}
                transition={{
                  duration: motionTokens.duration.fast,
                  ease: motionTokens.easing.out,
                }}
              >
                <div className="style-card__preview">
                  {option.colors.map((color, i) => (
                    <div key={i} style={{ backgroundColor: color, flex: 1 }} />
                  ))}
                </div>
                <div className="style-card__content">
                  <h3 className="style-card__title">{option.label}</h3>
                  <p className="style-card__description">{option.description}</p>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export default PresentationStyleStep

const stepStyles = `
.presentation-style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-24);
}

.style-card {
  width: 100%;
  background-color: var(--color-surface-base);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-lg);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition: all var(--motion-duration-base) ease;
  box-shadow: var(--elevation-1);
  display: flex;
  flex-direction: column;
  padding: 0;
}

.style-card:hover {
  box-shadow: var(--elevation-2);
  border-color: var(--color-border-dark);
}

.style-card--selected {
  border-color: var(--color-accent-base);
  box-shadow: 0 4px 12px var(--color-accent-shadow);
}

.style-card__preview {
  height: 80px;
  display: flex;
}

.style-card__content {
  padding: var(--spacing-32);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
}

.style-card__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  text-align: center;
  margin: 0;
}

.style-card__description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  text-align: left;
  margin: 0;
}
`

if (typeof document !== 'undefined') {
  const styleId = 'presentation-style-step-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = stepStyles
    document.head.appendChild(style)
  }
}

