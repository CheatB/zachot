/**
 * ModelRoutingPage
 * Interface to manage OpenAI model selection for each generation stage
 */

import { useState } from 'react'
import { Card, Stack, Button } from '@/ui'

type GenerationStage = 'structure' | 'sources' | 'generation' | 'refine'
type WorkType = 'essay' | 'coursework' | 'diploma' | 'task'

const workTypeLabels: Record<WorkType, string> = {
  essay: 'Реферат/Доклад',
  coursework: 'Курсовая работа',
  diploma: 'Диплом/ВКР',
  task: 'Решение задачи'
}

const stageLabels: Record<GenerationStage, string> = {
  structure: 'План (Structure)',
  sources: 'Источники (Sources)',
  generation: 'Текст (Generation)',
  refine: 'Правка (Refine)'
}

const availableModels = ['o3', 'gpt-5.2', 'gpt-5', 'gpt-5-mini', 'o4-mini', 'gpt-5-nano']

function ModelRoutingPage() {
  // Initial state mock (in real app, this would be fetched from API)
  const [routing, setRouting] = useState<Record<WorkType, Record<GenerationStage, string>>>({
    essay: { structure: 'o4-mini', sources: 'o4-mini', generation: 'gpt-5-mini', refine: 'gpt-5-mini' },
    coursework: { structure: 'o3', sources: 'o4-mini', generation: 'gpt-5', refine: 'o4-mini' },
    diploma: { structure: 'o3', sources: 'o4-mini', generation: 'gpt-5.2', refine: 'o4-mini' },
    task: { structure: 'o3', sources: 'o4-mini', generation: 'o3', refine: 'o4-mini' }
  })

  const [isSaving, setIsSubmitting] = useState(false)

  const handleModelChange = (workType: WorkType, stage: GenerationStage, model: string) => {
    setRouting(prev => ({
      ...prev,
      [workType]: {
        ...prev[workType],
        [stage]: model
      }
    }))
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    alert('Настройки роутинга сохранены!')
  }

  return (
    <Stack gap="xl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>Управление моделями</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Выберите мозг для каждого этапа генерации
          </p>
        </div>
        <Button variant="primary" onClick={handleSave} loading={isSaving}>
          Сохранить изменения
        </Button>
      </div>

      <Stack gap="lg">
        {(Object.keys(workTypeLabels) as WorkType[]).map((workType) => (
          <Card key={workType} style={{ padding: 'var(--spacing-24)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-16)', fontSize: 'var(--font-size-lg)' }}>
              {workTypeLabels[workType]}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-16)' }}>
              {(Object.keys(stageLabels) as GenerationStage[]).map((stage) => (
                <div key={stage}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    {stageLabels[stage]}
                  </label>
                  <select
                    value={routing[workType][stage]}
                    onChange={(e) => handleModelChange(workType, stage, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-base)',
                      backgroundColor: 'var(--color-neutral-10)',
                      fontSize: 'var(--font-size-sm)',
                      outline: 'none'
                    }}
                  >
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </Stack>
    </Stack>
  )
}

export default ModelRoutingPage

