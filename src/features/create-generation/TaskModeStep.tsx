/**
 * TaskModeStep
 * Шаг 3 для задач: Выбор режима решения (Ответ vs Разбор)
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import clsx from 'clsx'

export type TaskMode = 'quick' | 'step-by-step'

interface TaskModeStepProps {
  selectedMode: TaskMode | null
  onSelect: (mode: TaskMode) => void
}

function TaskModeStep({ selectedMode, onSelect }: TaskModeStepProps) {
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
        <div className="task-mode-grid">
          <motion.button
            type="button"
            className={clsx('mode-card', selectedMode === 'quick' && 'mode-card--selected')}
            onClick={() => onSelect('quick')}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--spacing-16)' }}>⚡</div>
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-8)' }}>
              Получить ответ
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Мгновенное подробное решение со всеми выкладками и финальным результатом.
            </p>
          </motion.button>

          <motion.button
            type="button"
            className={clsx('mode-card', selectedMode === 'step-by-step' && 'mode-card--selected')}
            onClick={() => onSelect('step-by-step')}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--spacing-16)' }}>👨‍🏫</div>
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-8)' }}>
              Хочу разобраться
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Интерактивный разбор: ИИ ведет вас по шагам, задает вопросы и объясняет теорию.
            </p>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default TaskModeStep

const stepStyles = `
.task-mode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-24);
}

.mode-card {
  padding: var(--spacing-32);
  background-color: var(--color-surface-base);
  border: 2px solid var(--color-border-base);
  border-radius: var(--radius-lg);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--elevation-1);
}

.mode-card:hover {
  box-shadow: var(--elevation-2);
  border-color: var(--color-border-dark);
}

.mode-card--selected {
  border-color: var(--color-accent-base);
  background-color: var(--color-accent-light);
  box-shadow: var(--elevation-2);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'task-mode-step-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = stepStyles
    document.head.appendChild(style)
  }
}

