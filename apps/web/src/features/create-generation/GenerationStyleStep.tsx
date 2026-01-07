/**
 * GenerationStyleStep
 * Шаг 1.7: Настройка сложности и стиля (Anti-detection)
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Stack } from '@/ui'
import type { ComplexityLevel } from './types'

interface GenerationStyleStepProps {
  complexity: ComplexityLevel
  humanity: number
  onChange: (updates: { complexityLevel?: ComplexityLevel; humanityLevel?: number }) => void
}

const complexityOptions: { id: ComplexityLevel; label: string; description: string }[] = [
  { id: 'school', label: 'Школьный проект', description: 'Простой язык, базовые понятия, доступное изложение.' },
  { id: 'student', label: 'Студенческая работа', description: 'Академический стиль, использование терминологии, глубина анализа.' },
  { id: 'research', label: 'Научная публикация', description: 'Высокий уровень абстракции, критический анализ, строгий научный язык.' },
]

function GenerationStyleStep({ complexity, humanity, onChange }: GenerationStyleStepProps) {
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
        <Stack gap="xl">
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-16)', color: 'var(--color-text-secondary)' }}>
              Уровень сложности
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
              {complexityOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ complexityLevel: option.id })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-16) var(--spacing-24)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: complexity === option.id ? 'var(--color-accent-base)' : 'var(--color-border-base)',
                    backgroundColor: complexity === option.id ? 'var(--color-accent-light)' : 'var(--color-surface-base)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                >
                  <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', textAlign: 'left' }}>{option.label}</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'var(--spacing-32)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-16)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)' }}>
                Очеловечивание (Anti-AI)
              </label>
              <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-accent-base)', fontWeight: 'bold' }}>{humanity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={humanity}
              onChange={(e) => onChange({ humanityLevel: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-accent-base)', cursor: 'pointer', height: '6px', borderRadius: 'var(--radius-full)' }}
            />
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-12)' }}>
              Высокий уровень усложняет синтаксис и убирает характерные алгоритмические шаблоны. Рекомендуется для курсовых.
            </p>
          </div>
        </Stack>
      </div>
    </motion.div>
  )
}

export default GenerationStyleStep
