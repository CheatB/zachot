import React, { useState, useEffect } from 'react';
import { Button, Stack } from '@/ui';
import { fetchModelRouting, saveModelRouting, type ModelRoutingConfig } from '@/shared/api/admin';

const modelOptions = [
  { value: 'openai/o3-mini', label: 'o3-mini (Reasoning High)' },
  { value: 'openai/o1-mini', label: 'o1-mini (Reasoning Mini)' },
  { value: 'openai/gpt-4o', label: 'gpt-4o (Standard)' },
  { value: 'openai/gpt-4o-mini', label: 'gpt-4o-mini (Economy)' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Best for Refine)' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek V3 (Ultra Economy)' },
];

const ModelRoutingPage: React.FC = () => {
  const [config, setConfig] = useState<ModelRoutingConfig | null>(null);
  const [isSaving, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const defaultConfig: ModelRoutingConfig = {
      essay: { structure: 'openai/o1-mini', sources: 'openai/gpt-4o-mini', generation: 'openai/gpt-4o', refine: 'anthropic/claude-3.5-sonnet' },
      diploma: { structure: 'openai/o3-mini', sources: 'openai/gpt-4o', generation: 'openai/gpt-4o', refine: 'anthropic/claude-3.5-sonnet' },
      presentation: { structure: 'openai/gpt-4o-mini', sources: 'openai/gpt-4o-mini', generation: 'openai/gpt-4o-mini', refine: 'openai/gpt-4o-mini' },
      task: { task_solve: 'openai/o1-mini' },
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

  const ModelSelect = ({ workType, stage }: { workType: string, stage: string }) => (
    <div className="admin-select-wrapper">
      <select 
        className="admin-select-minimal"
        value={config[workType]?.[stage] || ''}
        onChange={(e) => handleModelChange(workType, stage, e.target.value)}
      >
        {modelOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span className="admin-select-arrow">▾</span>
    </div>
  );

  return (
    <Stack gap="xl" style={{ maxWidth: '100%' }}>
      <header>
        <h1 style={{ color: 'var(--color-neutral-100)', marginBottom: 'var(--spacing-8)' }}>Модели и роутинг</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Персональные настройки AI-движка для каждого типа работ.
        </p>
      </header>

      <section className="routing-section">
        <h2 className="routing-section__title">Текстовые работы</h2>
        <div className="admin-table-container">
          <table className="admin-table-v2">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Вид работы</th>
                <th>План работы</th>
                <th>Источники</th>
                <th>Написание текста</th>
                <th className="refine-col-header">Очеловечивание</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Реферат / Курсовая</td>
                <td><ModelSelect workType="essay" stage="structure" /></td>
                <td><ModelSelect workType="essay" stage="sources" /></td>
                <td><ModelSelect workType="essay" stage="generation" /></td>
                <td className="refine-cell-v2"><ModelSelect workType="essay" stage="refine" /></td>
              </tr>
              <tr>
                <td>Диплом (ВКР)</td>
                <td><ModelSelect workType="diploma" stage="structure" /></td>
                <td><ModelSelect workType="diploma" stage="sources" /></td>
                <td><ModelSelect workType="diploma" stage="generation" /></td>
                <td className="refine-cell-v2"><ModelSelect workType="diploma" stage="refine" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="routing-section">
        <h2 className="routing-section__title">Презентации</h2>
        <div className="admin-table-container">
          <table className="admin-table-v2">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Вид работы</th>
                <th>План работы</th>
                <th>Источники</th>
                <th>Содержание слайдов</th>
                <th>Визуальный стиль</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Презентация</td>
                <td><ModelSelect workType="presentation" stage="structure" /></td>
                <td><ModelSelect workType="presentation" stage="sources" /></td>
                <td><ModelSelect workType="presentation" stage="generation" /></td>
                <td><ModelSelect workType="presentation" stage="refine" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="routing-section">
        <h2 className="routing-section__title">Решение задач</h2>
        <div className="admin-table-container">
          <table className="admin-table-v2">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Вид работы</th>
                <th>Решение задачи</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Задача</td>
                <td><ModelSelect workType="task" stage="task_solve" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-64)' }}>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleSave} 
          loading={isSaving}
          style={{ minWidth: '280px', height: '56px', fontSize: 'var(--font-size-base)' }}
        >
          Сохранить
        </Button>
      </div>

      {showToast && (
        <div className="admin-alert-toast">
          <div className="admin-alert-toast__icon">✅</div>
          <div className="admin-alert-toast__text">Настройки успешно обновлены</div>
        </div>
      )}

      <style>{`
        .routing-section {
          margin-bottom: var(--spacing-48);
        }
        .routing-section__title {
          font-size: var(--font-size-xl);
          color: var(--color-neutral-100);
          margin-bottom: var(--spacing-24);
          padding-left: var(--spacing-8);
          border-left: 4px solid var(--color-accent-base);
        }
        .admin-table-container {
          background: transparent;
          width: 100%;
        }
        .admin-table-v2 {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          text-align: left;
        }
        .admin-table-v2 th {
          padding: var(--spacing-16) var(--spacing-24);
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid var(--color-border-light);
        }
        .admin-table-v2 td {
          padding: var(--spacing-20) var(--spacing-24);
          border-bottom: 1px solid var(--color-border-light);
          background-color: transparent;
        }
        .admin-table-v2 tr:last-child td {
          border-bottom: none;
        }
        
        .refine-col-header {
          color: var(--color-accent-base) !important;
        }
        .refine-cell-v2 {
          background-color: rgba(22, 163, 74, 0.03);
          position: relative;
        }
        
        .admin-select-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          width: 100%;
        }
        .admin-select-minimal {
          appearance: none;
          background: transparent;
          border: none;
          color: var(--color-neutral-100);
          font-size: var(--font-size-sm);
          font-family: inherit;
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          width: 100%;
          padding-right: 20px;
          outline: none;
          transition: color 0.2s ease;
        }
        .admin-select-minimal:hover {
          color: var(--color-accent-base);
        }
        .admin-select-arrow {
          position: absolute;
          right: 0;
          pointer-events: none;
          font-size: 10px;
          color: var(--color-text-muted);
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
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
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

export default ModelRoutingPage;
