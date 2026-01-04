/**
 * GenerationConfirmStep
 * Шаг 3: Подтверждение и запуск
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Badge, Button } from '@/ui'
import type { GenerationType, GenerationTypeInfo } from './types'

interface GenerationConfirmStepProps {
  type: GenerationType
  input: string
  onConfirm: () => void
  onBack: () => void
  isSubmitting: boolean
}

const typeInfoMap: Record<GenerationType, GenerationTypeInfo> = {
  text: {
    title: 'Структурировать текст',
    placeholder: '',
    hint: '',
    helperText: '',
  },
  presentation: {
    title: 'Подготовить презентацию',
    placeholder: '',
    hint: '',
    helperText: '',
  },
  task: {
    title: 'Решить задачу',
    placeholder: '',
    hint: '',
    helperText: '',
  },
}

function GenerationConfirmStep({ type, input, onConfirm, onBack, isSubmitting }: GenerationConfirmStepProps) {
  const typeInfo = typeInfoMap[type]
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
          Проверьте данные
        </h2>
        <p
          className="wizard-step__subtitle"
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-32)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          Убедитесь, что всё верно, и запустите генерацию
        </p>

        <Card className="wizard-summary-card">
          <div className="wizard-summary">
            <div className="wizard-summary__row">
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Тип генерации:
              </span>
              <Badge status="neutral">{typeInfo.title}</Badge>
            </div>
            <div className="wizard-summary__row">
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Количество символов:
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {characterCount}
              </span>
            </div>
          </div>
        </Card>

        <div className="wizard-info-box">
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-relaxed)',
            }}
          >
            Генерация может занять несколько минут. Вы сможете закрыть страницу и вернуться позже.
          </p>
        </div>

        <div className="wizard-actions">
          <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
            Назад
          </Button>
          <Button variant="primary" onClick={onConfirm} loading={isSubmitting} disabled={isSubmitting}>
            Запустить генерацию
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default GenerationConfirmStep

const confirmStepStyles = `
.wizard-summary-card {
  margin-bottom: var(--spacing-24);
}

.wizard-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
}

.wizard-summary__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wizard-info-box {
  padding: var(--spacing-16);
  background-color: var(--color-neutral-20);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-32);
}

.wizard-actions {
  display: flex;
  gap: var(--spacing-16);
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .wizard-actions {
    flex-direction: column-reverse;
  }
  
  .wizard-actions button {
    width: 100%;
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'wizard-confirm-step-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = confirmStepStyles
    document.head.appendChild(style)
  }
}


