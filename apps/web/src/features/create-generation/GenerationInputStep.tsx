/**
 * GenerationInputStep
 * Шаг 2: Ввод данных
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Textarea, Button } from '@/ui'
import type { GenerationType, GenerationTypeInfo } from './types'

interface GenerationInputStepProps {
  type: GenerationType
  input: string
  onInputChange: (value: string) => void
  onShowError?: () => void
}

const typeInfoMap: Record<GenerationType, GenerationTypeInfo> = {
  text: {
    title: 'Введите текст для структурирования',
    placeholder: 'Например:\n\nИстория России — это многовековая история развития государства...',
    hint: 'Можно вставить сырой текст, мы всё обработаем',
    helperText: 'Ничего страшного, если текст сырой. Мы поможем аккуратно структурировать ваш материал.',
  },
  presentation: {
    title: 'Подготовьте материал для презентации',
    placeholder: 'Введите текст, который нужно преобразовать в презентацию...',
    hint: 'Можно использовать любой текст, мы создадим структурированную презентацию',
    helperText: 'Вы всегда сможете вернуться к результату позже и внести изменения.',
  },
  task: {
    title: 'Опишите задачу',
    placeholder: 'Например:\n\nРешить уравнение: 2x + 5 = 15\n\nНайти значение x...',
    hint: 'Опишите задачу максимально подробно',
    helperText: 'Чем подробнее описание, тем точнее будет решение.',
  },
}

function GenerationInputStep({ type, input, onInputChange, onShowError }: GenerationInputStepProps) {
  const [hasError, setHasError] = useState(false)
  const typeInfo = typeInfoMap[type]

  const handleShowError = () => {
    setHasError(true)
    onShowError?.()
    setTimeout(() => setHasError(false), 3000)
  }

  const characterCount = input.length

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
          {typeInfo.title}
        </h2>

        <div className="wizard-input-wrapper">
          <Textarea
            label=""
            placeholder={typeInfo.placeholder}
            hint={typeInfo.hint}
            error={hasError ? 'Произошла ошибка при обработке. Попробуйте ещё раз.' : undefined}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            rows={12}
            style={{
              minHeight: '200px',
              fontFamily: 'var(--font-family-sans)',
            }}
          />

          <div className="wizard-input-footer">
            <div className="wizard-input-counter">
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {characterCount} символов
              </span>
            </div>
            {onShowError && (
              <Button variant="ghost" size="sm" onClick={handleShowError}>
                Показать пример ошибки
              </Button>
            )}
          </div>

          <p
            className="wizard-input-helper"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              lineHeight: 'var(--line-height-relaxed)',
              marginTop: 'var(--spacing-16)',
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
  justify-content: space-between;
  align-items: center;
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


