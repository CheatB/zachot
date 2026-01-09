/**
 * GenerationInputStep
 * Шаг 2: Тема и детали
 * Updated for "juicy" landing page aesthetic
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Textarea } from '@/ui'
import type { GenerationType, GenerationTypeInfo } from './types'

interface GenerationInputStepProps {
  type: GenerationType
  input: string
  onInputChange: (value: string) => void
  onShowError?: () => void
}

const typeInfoMap: Record<GenerationType, GenerationTypeInfo> = {
  text: {
    title: 'О чем будет работа?',
    placeholder: 'Введите тему или вставьте план/тезисы, если они есть...',
    hint: 'Чем подробнее описание, тем точнее будет черновик',
    helperText: 'На основе этой темы мы предложим цель и структуру работы на следующем шаге.',
  },
  presentation: {
    title: 'Тема презентации',
    placeholder: 'Опишите тему выступления и основные тезисы...',
    hint: 'Мы подготовим логическую структуру слайдов',
    helperText: 'Вы сможете отредактировать содержание перед финальной генерацией.',
  },
  task: {
    title: 'Условие задачи',
    placeholder: 'Вставьте текст задачи, условия и требования к решению...',
    hint: 'Укажите известные данные и что именно нужно найти',
    helperText: 'ИИ проанализирует условие и подготовит пошаговый алгоритм решения.',
  },
}

function GenerationInputStep({ type, input, onInputChange }: GenerationInputStepProps) {
  const typeInfo = typeInfoMap[type]

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
        <div className="wizard-input-wrapper">
          <Textarea
            label=""
            placeholder={typeInfo.placeholder}
            hint={typeInfo.hint}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            rows={10}
            style={{
              minHeight: '240px',
              fontFamily: 'var(--font-family-sans)',
              fontSize: 'var(--font-size-base)',
              padding: 'var(--spacing-24)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-neutral-10)',
              border: '1px solid var(--color-border-base)',
              boxShadow: 'var(--elevation-1)'
            }}
          />

          <p
            className="wizard-input-helper"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-relaxed)',
              marginTop: 'var(--spacing-8)'
            }}
          >
            {typeInfo.helperText}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default GenerationInputStep

const inputStepStyles = `
.wizard-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
}

.wizard-input-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: -48px; /* Overlay counter on textarea bottom */
  margin-right: 16px;
  position: relative;
  z-index: 2;
}

.wizard-input-counter {
  display: flex;
  align-items: center;
}
`

if (typeof document !== 'undefined') {
  const styleId = 'wizard-input-step-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = inputStepStyles
    document.head.appendChild(style)
  }
}
