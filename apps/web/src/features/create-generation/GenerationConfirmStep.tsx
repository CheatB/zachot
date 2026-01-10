/**
 * GenerationConfirmStep
 * Шаг подтверждения и запуска
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Button, Stack } from '@/ui'
import type { GenerationType, GenerationTypeInfo, WorkType, TaskMode, ComplexityLevel } from './types'
import { workTypeConfigs } from './types'

interface GenerationConfirmStepProps {
  type: GenerationType
  workType: WorkType | null
  taskMode: TaskMode | null
  input: string
  hasFiles: boolean
  useSmartProcessing: boolean
  complexityLevel: ComplexityLevel
  humanityLevel: number
  volume: number
  onToggleSmartProcessing: (val: boolean) => void
  onConfirm: () => void
  onBack: () => void
  onJumpToStep: (step: number) => void
  isSubmitting: boolean
}

const typeInfoMap: Record<GenerationType, GenerationTypeInfo> = {
  text: { title: 'Текстовая работа', placeholder: '', hint: '', helperText: '' },
  presentation: { title: 'Презентация', placeholder: '', hint: '', helperText: '' },
  task: { title: 'Решение задач', placeholder: '', hint: '', helperText: '' },
}

function GenerationConfirmStep({ 
  type, 
  workType, 
  taskMode, 
  input, 
  hasFiles, 
  useSmartProcessing,
  complexityLevel,
  humanityLevel,
  volume,
  onToggleSmartProcessing,
  onConfirm, 
  onBack,
  onJumpToStep,
  isSubmitting 
}: GenerationConfirmStepProps) {
  const typeInfo = typeInfoMap[type]
  const workTypeLabel = workType ? workTypeConfigs[workType].label : null
  const taskModeLabel = taskMode === 'quick' ? 'Быстрое решение' : 'Пошаговый разбор'

  const SummaryItem = ({ label, value, step }: { label: string, value: React.ReactNode, step?: number }) => (
    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', padding: '12px 0', gap: '24px' }}>
      <span style={{ fontSize: '18px', color: 'var(--color-text-muted)', minWidth: '160px' }}>{label}</span>
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
        <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-neutral-100)' }}>{value}</span>
        {step && (
          <button 
            onClick={() => onJumpToStep(step)}
            style={{ 
              fontSize: '12px', 
              color: 'var(--color-accent-base)', 
              background: 'none', 
              border: 'none', 
              padding: 0, 
              cursor: 'pointer',
              textDecoration: 'underline',
              fontWeight: 'bold'
            }}
          >
            Изменить
          </button>
        )}
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
      }}
      style={{ width: '100%' }}
    >
      <div className="wizard-step" style={{ padding: 0 }}>
        <Stack gap="lg" style={{ width: '100%' }}>
          <div className="wizard-summary-content">
            <Stack gap="sm">
              <SummaryItem label="Тип работы:" value={workTypeLabel || typeInfo.title} step={1} />
              
              {type === 'task' ? (
                <SummaryItem label="Режим решения:" value={taskModeLabel} step={1.3} />
              ) : (
                <>
                  <SummaryItem label="Сложность:" value={complexityLevel === 'student' ? 'Студенческая' : 'Школьная'} step={1.7} />
                  <SummaryItem label="Очеловечивание:" value={`${humanityLevel}%`} step={1.7} />
                  <SummaryItem label="Объём:" value={`${volume} стр.`} step={3} />
                </>
              )}

              <div style={{ height: '1px', backgroundColor: 'var(--color-border-light)', margin: '16px 0' }} />

              <SummaryItem 
                label={type === 'task' ? 'Условие:' : 'Тема:'} 
                value={input ? (input.length > 150 ? `${input.substring(0, 150)}...` : input) : (hasFiles ? 'Загружен файл' : '—')} 
                step={type === 'task' ? 1.2 : 1.5}
              />
            </Stack>
          </div>

          {type === 'presentation' && (
            <div className="smart-processing-toggle" style={{ 
              padding: 'var(--spacing-16) var(--spacing-24)', 
              backgroundColor: 'var(--color-accent-light)', 
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--color-accent-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--spacing-16)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-sm)', color: 'var(--color-accent-dark)' }}>
                  🪄 Smart-обработка изображений
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                  Автоматическое удаление фона, цветокоррекция и подбор иконок под стиль работы
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={useSmartProcessing} 
                onChange={(e) => onToggleSmartProcessing(e.target.checked)} 
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-accent-base)' }}
              />
            </div>
          )}

          <div className="wizard-actions" style={{ display: 'flex', gap: 'var(--spacing-16)', justifyContent: 'flex-end', marginTop: 'var(--spacing-24)' }}>
            <Button 
              variant="secondary" 
              onClick={onBack} 
              disabled={isSubmitting}
              style={{ height: '56px', padding: '0 40px', borderRadius: '12px', fontSize: '16px' }}
            >
              Назад
            </Button>
            <Button 
              variant="primary" 
              onClick={onConfirm} 
              loading={isSubmitting} 
              disabled={isSubmitting}
              style={{ height: '56px', padding: '0 64px', borderRadius: '12px', fontSize: '16px' }}
            >
              Создать работу
            </Button>
          </div>
        </Stack>
      </div>
    </motion.div>
  )
}

export default GenerationConfirmStep
