/**
 * GenerationConfirmStep
 * Шаг подтверждения и запуска
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Badge, Button, Stack } from '@/ui'
import type { GenerationType, GenerationTypeInfo, WorkType, TaskMode } from './types'
import { workTypeConfigs } from './types'

interface GenerationConfirmStepProps {
  type: GenerationType
  workType: WorkType | null
  taskMode: TaskMode | null
  input: string
  hasFiles: boolean
  onConfirm: () => void
  onBack: () => void
  isSubmitting: boolean
}

const typeInfoMap: Record<GenerationType, GenerationTypeInfo> = {
  text: { title: 'Реферат или доклад', placeholder: '', hint: '', helperText: '' },
  presentation: { title: 'Презентация', placeholder: '', hint: '', helperText: '' },
  task: { title: 'Решение задач', placeholder: '', hint: '', helperText: '' },
}

function GenerationConfirmStep({ 
  type, 
  workType, 
  taskMode, 
  input, 
  hasFiles, 
  onConfirm, 
  onBack, 
  isSubmitting 
}: GenerationConfirmStepProps) {
  const typeInfo = typeInfoMap[type]
  const workTypeLabel = workType ? workTypeConfigs[workType].label : null
  const taskModeLabel = taskMode === 'quick' ? 'Быстрое решение' : 'Пошаговый разбор'

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
        <Stack gap="md">
          <Card className="wizard-summary-card">
            <div className="wizard-summary" style={{ padding: 'var(--spacing-20)' }}>
              <Stack gap="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Тип работы:</span>
                  <Badge status="neutral">{workTypeLabel || typeInfo.title}</Badge>
                </div>
                
                {type === 'task' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Режим:</span>
                    <Badge status="success">{taskModeLabel}</Badge>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    {type === 'task' ? 'Условие:' : 'Тема:'}
                  </span>
                  <span style={{ 
                    fontSize: 'var(--font-size-base)', 
                    fontWeight: 'var(--font-weight-medium)', 
                    color: 'var(--color-text-primary)',
                    maxWidth: '70%',
                    textAlign: 'right'
                  }}>
                    {input ? (input.length > 100 ? `${input.substring(0, 100)}...` : input) : (hasFiles ? 'Загружен файл' : '—')}
                  </span>
                </div>

                {hasFiles && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Прикреплено:</span>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success-base)' }}>✓ Файл(ы) загружен(ы)</span>
                  </div>
                )}
              </Stack>
            </div>
          </Card>

          <div className="wizard-info-box" style={{ padding: 'var(--spacing-16)', backgroundColor: 'var(--color-neutral-10)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
              {type === 'task' 
                ? 'Система проанализирует условие и подготовит подробное решение.' 
                : 'На следующем этапе вы сможете отредактировать предложенную цель и план работы.'}
            </p>
          </div>

          <div className="wizard-actions" style={{ display: 'flex', gap: 'var(--spacing-16)', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>Назад</Button>
            <Button variant="primary" onClick={onConfirm} loading={isSubmitting} disabled={isSubmitting}>
              {type === 'task' ? 'Начать решение' : 'Создать черновик'}
            </Button>
          </div>
        </Stack>
      </div>
    </motion.div>
  )
}

export default GenerationConfirmStep
