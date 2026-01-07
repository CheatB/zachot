import React, { useState, useEffect } from 'react';
import { Card, Button, Stack } from '@/ui';
import { fetchModelRouting, saveModelRouting, type ModelRoutingConfig } from '@/shared/api/admin';

type WorkType = 'essay' | 'diploma' | 'presentation' | 'task';
type Stage = 'structure' | 'sources' | 'generation' | 'refine';

const modelOptions = [
  { value: 'openai/o3-mini', label: 'o3-mini (Reasoning High)' },
  { value: 'openai/o1-mini', label: 'o1-mini (Reasoning Mini)' },
  { value: 'openai/gpt-4o', label: 'gpt-4o (Standard)' },
  { value: 'openai/gpt-4o-mini', label: 'gpt-4o-mini (Economy)' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Best for Refine)' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek V3 (Ultra Economy)' },
];

const workTypes: { value: WorkType; label: string }[] = [
  { value: 'essay', label: 'Реферат / Курсовая' },
  { value: 'diploma', label: 'Диплом (ВКР)' },
  { value: 'presentation', label: 'Презентация' },
  { value: 'task', label: 'Решение задачи' },
];

const stages: { value: Stage; label: string }[] = [
  { value: 'structure', label: 'План работы' },
  { value: 'sources', label: 'Источники' },
  { value: 'generation', label: 'Написание текста' },
  { value: 'refine', label: 'Очеловечивание' },
];

const ModelRoutingPage: React.FC = () => {
  const [config, setConfig] = useState<ModelRoutingConfig | null>(null);
  const [isSaving, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Временно используем дефолтные значения OpenRouter, пока API не отдает реальные
    const defaultConfig: ModelRoutingConfig = {
      essay: { structure: 'openai/o1-mini', sources: 'openai/gpt-4o-mini', generation: 'openai/gpt-4o', refine: 'anthropic/claude-3.5-sonnet' },
      diploma: { structure: 'openai/o3-mini', sources: 'openai/gpt-4o', generation: 'openai/gpt-4o', refine: 'anthropic/claude-3.5-sonnet' },
      presentation: { structure: 'openai/gpt-4o-mini', sources: 'openai/gpt-4o-mini', generation: 'openai/gpt-4o-mini', refine: 'openai/gpt-4o-mini' },
      task: { structure: 'openai/o1-mini', sources: 'openai/gpt-4o-mini', generation: 'openai/o1-mini', refine: 'openai/gpt-4o-mini' },
    };
    fetchModelRouting().then(data => setConfig({ ...defaultConfig, ...data }));
  }, []);

  const handleModelChange = (workType: string, stage: string, model: string) => {
    if (!config) return;
    setConfig(prev => ({
      ...prev!,
      [workType]: {
        ...prev![workType],
        [stage]: model
      }
    }));
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSubmitting(true);
    try {
      await saveModelRouting(config);
      alert('Настройки роутинга сохранены!');
    } catch (error) {
      alert('Ошибка при сохранении');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!config) return <div>Загрузка настроек...</div>;

  return (
    <Stack gap="xl">
      <header>
        <h1 style={{ color: 'var(--color-neutral-100)', marginBottom: 'var(--spacing-8)' }}>Управление моделями</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Настройте, какая модель будет отвечать за каждый этап генерации работы.
        </p>
      </header>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Тип работы</th>
                {stages.map(s => <th key={s.value}>{s.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {workTypes.map(wt => (
                <tr key={wt.value}>
                  <td style={{ fontWeight: 'bold' }}>{wt.label}</td>
                  {stages.map(s => (
                    <td key={s.value}>
                      <select 
                        className="admin-select"
                        value={config[wt.value][s.value]}
                        onChange={(e) => handleModelChange(wt.value, s.value, e.target.value)}
                      >
                        {modelOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="lg" onClick={handleSave} loading={isSaving}>
          Сохранить настройки
        </Button>
      </div>

      <style>{`
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th {
          padding: var(--spacing-16);
          background-color: var(--color-neutral-10);
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--color-border-base);
        }
        .admin-table td {
          padding: var(--spacing-16);
          border-bottom: 1px solid var(--color-border-base);
        }
        .admin-select {
          width: 100%;
          padding: var(--spacing-8) var(--spacing-12);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-base);
          background-color: var(--color-surface-base);
          font-family: inherit;
          font-size: var(--font-size-sm);
          cursor: pointer;
          outline: none;
        }
        .admin-select:focus {
          border-color: var(--color-accent-base);
        }
      `}</style>
    </Stack>
  );
};

export default ModelRoutingPage;

