/**
 * WorkTypeStep
 * Шаг 1.1: Выбор типа академической работы + ввод темы
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { workTypeConfigs, type WorkType, type GenerationType } from './types'
import { Textarea } from '@/ui'
import clsx from 'clsx'

// Стоимость в кредитах по типам работ (синхронизировано с backend)
const CREDIT_COSTS: Record<WorkType, number> = {
  referat: 1,
  doklad: 1,
  essay: 1,
  composition: 1,
  article: 2,
  kursach: 3,
  other: 2,
}

interface WorkTypeStepProps {
  type: GenerationType
  selectedWorkType: WorkType | null
  onSelect: (type: WorkType) => void
  input: string
  onInputChange: (value: string) => void
}

function WorkTypeStep({ type, selectedWorkType, onSelect, input, onInputChange }: WorkTypeStepProps) {
  const placeholder = type === 'presentation' 
    ? 'Опишите тему выступления и основные тезисы...' 
    : 'Введите тему или вставьте план/тезисы, если они есть...'

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
        <div className="work-type-grid" style={{ marginBottom: 'var(--spacing-48)' }}>
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
                <div className="work-type-card__credits">
                  {CREDIT_COSTS[config.id]} {CREDIT_COSTS[config.id] === 1 ? 'кредит' : CREDIT_COSTS[config.id] < 5 ? 'кредита' : 'кредитов'}
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
            О чем будет работа?
          </label>
          <Textarea
            label=""
            placeholder={placeholder}
            hint="Чем подробнее описание, тем точнее будет черновик"
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

export default WorkTypeStep

const stepStyles = `
.work-type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-12);
  justify-content: flex-start;
}

.work-type-card {
  padding: var(--spacing-12) var(--spacing-24);
  background-color: var(--color-accent-light);
  border: 1px solid var(--color-accent-base);
  border-radius: var(--radius-full);
  text-align: center;
  cursor: pointer;
  transition: all var(--motion-duration-base) ease;
  min-width: 140px;
}

.work-type-card:hover {
  background-color: var(--color-accent-base);
  color: var(--color-text-inverse);
}

.work-type-card--selected {
  background-color: var(--color-accent-base);
  color: var(--color-text-inverse);
  box-shadow: 0 4px 12px var(--color-accent-shadow);
}

.work-type-card__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: inherit;
}

.work-type-card__credits {
  font-size: var(--font-size-xs);
  opacity: 0.7;
  margin-top: 2px;
}

.wizard-input-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
}
`

if (typeof document !== 'undefined') {
  const styleId = 'work-type-step-styles'
  let style = document.getElementById(styleId) as HTMLStyleElement
  if (!style) {
    style = document.createElement('style')
    style.id = styleId
    document.head.appendChild(style)
  }
  style.textContent = stepStyles
}
