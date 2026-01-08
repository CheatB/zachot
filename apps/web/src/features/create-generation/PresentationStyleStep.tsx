/**
 * PresentationStyleStep
 * Шаг 1.2: Выбор визуального стиля + ввод темы
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Textarea } from '@/ui'
import { type PresentationStyle, type GenerationType } from './types'
import clsx from 'clsx'
import { useEffect } from 'react'

interface PresentationStyleStepProps {
  type: GenerationType
  selectedStyle: PresentationStyle | null
  onSelect: (style: PresentationStyle) => void
  input: string
  onInputChange: (value: string) => void
}

const styleOptions: { id: PresentationStyle; label: string; description: string; colors: string[] }[] = [
  { 
    id: 'academic', 
    label: 'Академический', 
    description: 'Строгий стиль, синие и серые тона, классические шрифты.',
    colors: ['#1e3a8a', '#f8fafc', '#334155']
  },
  { 
    id: 'business', 
    label: 'Бизнес', 
    description: 'Профессиональный и чистый. Акцент на графиках и структуре.',
    colors: ['#0f172a', '#ffffff', '#2563eb']
  },
  { 
    id: 'modern', 
    label: 'Современный', 
    description: 'Яркие акценты, динамичная верстка, современные шрифты.',
    colors: ['#7c3aed', '#fdf2f8', '#111827']
  },
  { 
    id: 'minimalist', 
    label: 'Минимализм', 
    description: 'Максимум воздуха, минимум лишних деталей. Только главное.',
    colors: ['#000000', '#ffffff', '#71717a']
  },
]

function PresentationStyleStep({ selectedStyle, onSelect, input, onInputChange }: PresentationStyleStepProps) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'presentation-style-step-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = presentationStyles
    }
  }, [])

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
        <div className="presentation-style-grid" style={{ marginBottom: 'var(--spacing-48)' }}>
          {styleOptions.map((style) => {
            const isSelected = selectedStyle === style.id
            return (
              <motion.button
                key={style.id}
                type="button"
                className={clsx('style-card', isSelected && 'style-card--selected')}
                onClick={() => onSelect(style.id)}
                whileHover={{ y: -4 }}
                whileTap={{ y: 0 }}
                transition={{
                  duration: motionTokens.duration.fast,
                  ease: motionTokens.easing.out,
                }}
              >
                <div className="style-card__preview">
                  {style.colors.map((color, idx) => (
                    <div key={idx} style={{ backgroundColor: color, flex: 1 }} />
                  ))}
                </div>
                <div className="style-card__content">
                  <h3 className="style-card__title">{style.label}</h3>
                  <p className="style-card__description">{style.description}</p>
                </div>
              </motion.button>
            )
          })}
        </div>

        <div className="wizard-input-wrapper">
          <label style={{ 
            display: 'block', 
            fontSize: 'var(--font-size-sm)', 
            fontWeight: 'var(--font-weight-semibold)', 
            marginBottom: 'var(--spacing-12)',
            color: 'var(--color-text-secondary)'
          }}>
            Тема презентации
          </label>
          <Textarea
            label=""
            placeholder="Опишите тему выступления и основные тезисы..."
            hint="Мы подготовим логическую структуру слайдов"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            rows={6}
            style={{
              minHeight: '160px',
              fontFamily: 'var(--font-family-sans)',
              fontSize: 'var(--font-size-base)',
              padding: 'var(--spacing-24)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-neutral-10)',
              border: '1px solid var(--color-border-base)',
              boxShadow: 'var(--elevation-1)'
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default PresentationStyleStep

const presentationStyles = `
.presentation-style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-16);
}

.style-card {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.style-card:hover {
  border-color: var(--color-accent-base);
  box-shadow: var(--elevation-2);
}

.style-card--selected {
  border-color: var(--color-accent-base);
  box-shadow: 0 0 0 2px var(--color-accent-base);
}

.style-card__preview {
  height: 60px;
  display: flex;
}

.style-card__content {
  padding: var(--spacing-12);
}

.style-card__title {
  font-size: var(--font-size-sm);
  font-weight: bold;
  margin-bottom: 4px;
}

.style-card__description {
  font-size: 11px;
  color: var(--color-text-secondary);
  line-height: 1.3;
}

.wizard-input-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
}
`
