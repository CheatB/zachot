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
  const [showToast, setShowToast] = useState(false);

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
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
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
        <h1 style={{ color: 'var(--color-neutral-100)', marginBottom: 'var(--spacing-8)' }}>Модели и роутинг</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Настройте, какая модель будет отвечать за каждый этап генерации работы.
        </p>
      </header>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ minWidth: '240px' }}>Тип работы</th>
                <th style={{ minWidth: '200px' }}>План работы</th>
                <th style={{ minWidth: '200px' }}>Источники</th>
                <th style={{ minWidth: '200px' }}>Написание текста</th>
                <th style={{ minWidth: '200px' }} className="refine-col">Очеловечивание</th>
              </tr>
            </thead>
            <tbody>
              {workTypes.map(wt => (
                <tr key={wt.value}>
                  <td style={{ fontWeight: 'bold' }}>{wt.label}</td>
                  {stages.map(s => (
                    <td key={s.value} className={clsx(s.value === 'refine' && 'refine-cell')}>
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

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-48)' }}>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleSave} 
          loading={isSaving}
          style={{ minWidth: '240px' }}
        >
          Сохранить
        </Button>
      </div>

      {showToast && (
        <div className="admin-alert-toast">
          <div className="admin-alert-toast__icon">✅</div>
          <div className="admin-alert-toast__text">Настройки роутинга успешно сохранены!</div>
        </div>
      )}

      <style>{`
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th {
          padding: var(--spacing-20) var(--spacing-24);
          background-color: var(--color-neutral-10);
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--color-border-base);
        }
        .admin-table td {
          padding: var(--spacing-20) var(--spacing-24);
          border-bottom: 1px solid var(--color-border-base);
        }
        .refine-col {
          background-color: var(--color-neutral-20) !important;
        }
        .refine-cell {
          background-color: rgba(0, 0, 0, 0.03);
          animation: pulse-bg 2s infinite ease-in-out;
        }
        @keyframes pulse-bg {
          0% { background-color: rgba(0, 0, 0, 0.02); }
          50% { background-color: rgba(0, 0, 0, 0.05); }
          100% { background-color: rgba(0, 0, 0, 0.02); }
        }
        .admin-select {
          width: 100%;
          padding: var(--spacing-12) var(--spacing-16);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-base);
          background-color: var(--color-surface-base);
          font-family: inherit;
          font-size: var(--font-size-sm);
          cursor: pointer;
          outline: none;
          transition: all 0.2s ease;
        }
        .admin-select:focus {
          border-color: var(--color-accent-base);
          box-shadow: 0 0 0 3px var(--color-accent-light);
        }
        .admin-alert-toast {
          position: fixed;
          bottom: var(--spacing-48);
          left: 50%;
          transform: translateX(-50%);
          background-color: var(--color-neutral-100);
          color: white;
          padding: var(--spacing-16) var(--spacing-32);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          gap: var(--spacing-16);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          z-index: 10000;
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slide-up {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .admin-alert-toast__icon {
          font-size: 20px;
        }
        .admin-alert-toast__text {
          font-weight: var(--font-weight-medium);
          font-size: var(--font-size-base);
        }
      `}</style>
    </Stack>
  );
};

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

