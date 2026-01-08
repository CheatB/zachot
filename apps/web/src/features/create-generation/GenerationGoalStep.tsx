/**
 * GenerationGoalStep
 * Шаг 2: Цель, идея, объем
 * Updated for "juicy" landing page aesthetic
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Input, Textarea, Stack, Tooltip } from '@/ui'
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
        <Stack gap="2xl" style={{ position: 'relative' }}>
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: -20,
              left: -20,
              right: -20,
              bottom: -20,
              backgroundColor: 'rgba(255,255,255,0.7)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-lg)'
            }}>
              <div style={{ color: 'var(--color-accent-base)', fontWeight: 'bold' }}>🪄 Генерируем идеи...</div>
            </div>
          )}

          <Stack gap="xl">
            <div className="form-field-group">
              <label style={{ 
                display: 'block', 
                fontSize: 'var(--font-size-base)', 
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-relaxed)',
                marginBottom: 'var(--spacing-8)'
              }}>
                Цель работы — поможет системе лучше структурировать материал
              </label>
              <Input
                value={form.goal}
                onChange={(e) => onChange({ goal: e.target.value })}
                placeholder="Например: Изучить влияние ИИ на современное образование..."
                style={{ fontSize: 'var(--font-size-base)' }}
              />
            </div>

            <div className="form-field-group">
              <label style={{ 
                display: 'block', 
                fontSize: 'var(--font-size-base)', 
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-relaxed)',
                marginBottom: 'var(--spacing-8)'
              }}>
                Основная идея — это фундамент вашей будущей работы
              </label>
              <Textarea
                value={form.idea}
                onChange={(e) => onChange({ idea: e.target.value })}
                placeholder="Опишите кратко, о чем будет ваша работа..."
                rows={4}
                style={{ fontSize: 'var(--font-size-base)' }}
              />
            </div>
          </Stack>

          <div style={{ marginTop: 'var(--spacing-16)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)', marginBottom: 'var(--spacing-16)' }}>
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
                <div style={{ padding: '8px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Распределение страниц:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <span>Титульный лист и Содержание:</span>
                      <span style={{ fontWeight: 'bold' }}>2 стр.</span>
                    </div>
                    <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <span>Основной текст (главы):</span>
                      <span style={{ fontWeight: 'bold' }}>{Math.max(1, form.volume - 3)} стр.</span>
                    </div>
                    <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <span>Список источников:</span>
                      <span style={{ fontWeight: 'bold' }}>1 стр.</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '11px', fontStyle: 'italic', opacity: 0.9 }}>
                    * Стандарт ГОСТ: Шрифт 14 пт, интервал 1.5
                  </div>
                </div>
              }>
                <div style={{ 
                  cursor: 'help', 
                  display: 'inline-flex', 
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-xs)',
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                  backgroundColor: 'var(--color-neutral-10)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)'
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
                minWidth: '100px',
                padding: 'var(--spacing-12) var(--spacing-20)',
                backgroundColor: 'var(--color-accent-base)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 'var(--font-size-base)',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
              }}>
                {form.volume} стр.
              </div>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-16)' }}>
              Объём влияет на количество глав и глубину проработки материала.
            </p>
          </div>
        </Stack>
      </div>
    </motion.div>
  )
}

export default GenerationGoalStep
