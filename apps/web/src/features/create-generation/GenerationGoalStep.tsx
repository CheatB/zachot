/**
 * GenerationGoalStep
 * Шаг 2: Цель, идея, объем
 * Updated for "juicy" landing page aesthetic
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Input, Textarea, Stack, Card, Tooltip } from '@/ui'
import type { CreateGenerationForm } from './types'

interface GenerationGoalStepProps {
  form: CreateGenerationForm
  onChange: (updates: Partial<CreateGenerationForm>) => void
  isLoading?: boolean
}

function GenerationGoalStep({ form, onChange, isLoading }: GenerationGoalStepProps) {
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
        <Stack gap="xl">
          <Card variant="default" style={{ borderLeft: '4px solid var(--color-accent-base)', position: 'relative' }}>
            {isLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255,255,255,0.7)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'inherit'
              }}>
                <div style={{ color: 'var(--color-accent-base)', fontWeight: 'bold' }}>🪄 Генерируем идеи...</div>
              </div>
            )}
            <Stack gap="lg">
              <Input
                label="Цель работы"
                value={form.goal}
                onChange={(e) => onChange({ goal: e.target.value })}
                placeholder="Например: Изучить влияние ИИ на современное образование..."
                hint="Четкая цель поможет алгоритмам лучше структурировать материал"
                style={{ fontSize: 'var(--font-size-base)' }}
              />

              <Textarea
                label="Основная идея (тезис)"
                value={form.idea}
                onChange={(e) => onChange({ idea: e.target.value })}
                placeholder="Опишите кратко, о чем будет ваша работа..."
                rows={3}
                hint="Это фундамент вашего будущего черновика"
                style={{ fontSize: 'var(--font-size-base)' }}
              />
            </Stack>
          </Card>

          <Card variant="default" style={{ backgroundColor: 'var(--color-neutral-10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)', marginBottom: 'var(--spacing-16)' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                📊 Примерный объём работы
              </label>
              <Tooltip content={
                <div style={{ padding: '4px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Распределение страниц:</div>
                  <div style={{ fontSize: '12px' }}>Титульник — 1</div>
                  <div style={{ fontSize: '12px' }}>Содержание — 1</div>
                  <div style={{ fontSize: '12px' }}>Основная часть — {Math.max(1, form.volume - 3)}</div>
                  <div style={{ fontSize: '12px' }}>Список литературы — 1</div>
                  <div style={{ marginTop: '4px', fontStyle: 'italic', opacity: 0.8 }}>Times New Roman 14 пт, интервал 1,5</div>
                </div>
              }>
                <div style={{ 
                  cursor: 'help', 
                  display: 'inline-flex', 
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-xs)',
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted'
                }}>
                  Из чего складывается объём?
                </div>
              </Tooltip>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-24)' }}>
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={form.volume}
                  onChange={(e) => onChange({ volume: parseInt(e.target.value) })}
                  style={{ 
                    width: '100%', 
                    accentColor: 'var(--color-accent-base)',
                    cursor: 'pointer',
                    height: '6px',
                    borderRadius: 'var(--radius-full)'
                  }}
                />
              </div>
              <div style={{ 
                minWidth: '80px',
                padding: 'var(--spacing-8) var(--spacing-16)',
                backgroundColor: 'var(--color-accent-base)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
              }}>
                {form.volume} стр.
              </div>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-16)' }}>
              Объём влияет на количество глав и глубину проработки материала.
            </p>
          </Card>
        </Stack>
      </div>
    </motion.div>
  )
}

export default GenerationGoalStep
