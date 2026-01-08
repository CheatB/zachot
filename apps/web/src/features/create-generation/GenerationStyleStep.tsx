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

const humanityOptions = [
  { 
    id: 0, 
    label: 'Очеловечивание отключено', 
    description: 'На этом уровне система не применяет настройки «очеловечивания» к тексту. Он получается максимально структурированным, но может содержать типичные конструкции ИИ.' 
  },
  { 
    id: 50, 
    label: 'Базовое очеловечивание', 
    description: 'Текст становится более естественным и плавным за счет замены монотонных конструкций синонимами и удаления лишней канцелярии. Идеально для большинства учебных работ.' 
  },
  { 
    id: 100, 
    label: 'Anti-AI режим', 
    description: 'Максимальная имитация стиля живого автора. Система меняет ритм предложений и использует специфические обороты, чтобы успешно пройти проверку на детекторах ИИ-генерации.' 
  },
]

function GenerationStyleStep({ complexity, humanity, onChange }: GenerationStyleStepProps) {
  // Определяем активную опцию очеловечивания на основе текущего значения
  const getActiveHumanityId = (value: number) => {
    if (value < 20) return 0
    if (value <= 70) return 50
    return 100
  }

  const activeHumanityId = getActiveHumanityId(humanity)

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
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-16)', color: 'var(--color-text-secondary)' }}>
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
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', textAlign: 'right', maxWidth: '60%' }}>{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'var(--spacing-32)' }}>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-16)', color: 'var(--color-text-secondary)' }}>
              Очеловечивание (Anti-AI)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
              {humanityOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ humanityLevel: option.id })}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 'var(--spacing-4)',
                    padding: 'var(--spacing-16) var(--spacing-24)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: activeHumanityId === option.id ? 'var(--color-accent-base)' : 'var(--color-border-base)',
                    backgroundColor: activeHumanityId === option.id ? 'var(--color-accent-light)' : 'var(--color-surface-base)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>{option.label}</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </Stack>
      </div>
    </motion.div>
  )
}

export default GenerationStyleStep
