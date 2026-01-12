import React, { useState, useEffect } from 'react';
import { Button, Stack, Textarea } from '@/ui';
import { 
  fetchModelRouting, 
  saveModelRouting, 
  fetchPrompts, 
  savePrompts, 
  type ModelRoutingConfig, 
  type PromptConfig 
} from '@/shared/api/admin';

const modelOptions = [
  { value: 'openai/o3', label: 'o3 (Reasoning High)' },
  { value: 'openai/o1', label: 'o1 (Reasoning Mid)' },
  { value: 'openai/gpt-5.2', label: 'gpt-5.2 (Ultra High)' },
  { value: 'openai/gpt-4o', label: 'gpt-4o (Standard)' },
  { value: 'openai/gpt-4o-mini', label: 'gpt-4o-mini (Economy)' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Best for Refine)' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek V3 (Ultra Economy)' },
  { value: 'perplexity/sonar-pro', label: 'Perplexity Sonar Pro (Search)' },
  { value: 'perplexity/sonar-deep-research', label: 'Perplexity Deep Research' },
];

const ModelRoutingPage: React.FC = () => {
  const [config, setConfig] = useState<ModelRoutingConfig | null>(null);
  const [prompts, setPrompts] = useState<PromptConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'models' | 'prompts'>('models');

  useEffect(() => {
    fetchModelRouting().then(setConfig).catch(console.error);
    fetchPrompts().then(setPrompts).catch(console.error);
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

  const handlePromptChange = (name: string, value: string) => {
    if (!prompts) return;
    setPrompts(prev => ({
      ...prev!,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'models' && config) {
        await saveModelRouting(config);
      } else if (activeTab === 'prompts' && prompts) {
        await savePrompts(prompts);
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      alert('Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  if (!config || !prompts) return <div>Загрузка настроек...</div>;

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
        <h1 style={{ color: 'var(--color-neutral-100)', marginBottom: 'var(--spacing-8)' }}>Управление моделями и промптами</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Персональные настройки AI-движка и системных промптов.
        </p>
      </header>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'models' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          Роутинг моделей
        </button>
        <button 
          className={`admin-tab ${activeTab === 'prompts' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          Управление промптами
        </button>
      </div>

      {activeTab === 'models' ? (
        <>
          <section className="routing-section">
            <h2 className="routing-section__title">Текстовые работы</h2>
            <div className="admin-table-container">
              <table className="admin-table-v2">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Вид работы</th>
                    <th>Цель и Идея</th>
                    <th>План работы</th>
                    <th>Источники</th>
                    <th>Написание текста</th>
                    <th className="refine-col-header">Очеловечивание</th>
                  </tr>
                </thead>
                <tbody>
                  {['referat', 'kursach', 'essay', 'doklad', 'article', 'composition', 'other'].map(type => (
                    <tr key={type}>
                      <td>{type.charAt(0).toUpperCase() + type.slice(1)}</td>
                      <td><ModelSelect workType={type} stage="suggest_details" /></td>
                      <td><ModelSelect workType={type} stage="structure" /></td>
                      <td><ModelSelect workType={type} stage="sources" /></td>
                      <td><ModelSelect workType={type} stage="generation" /></td>
                      <td className="refine-cell-v2"><ModelSelect workType={type} stage="refine" /></td>
                    </tr>
                  ))}
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
                    <th>Цель и Идея</th>
                    <th>План работы</th>
                    <th>Источники</th>
                    <th>Содержание слайдов</th>
                    <th>Визуальный стиль</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Презентация</td>
                    <td><ModelSelect workType="presentation" stage="suggest_details" /></td>
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
        </>
      ) : (
        <section className="prompts-section">
          <Stack gap="2xl">
            {/* Блок 1: Анализ и подготовка */}
            <div className="prompt-group">
              <h2 className="prompt-group__title">Блок 1: Анализ и подготовка</h2>
              <Stack gap="xl">
                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">1.1 Классификатор (Task vs Chat)</h3>
                  <p className="prompt-editor-block__desc">Определяет, является ли ввод условием задачи или просто общением. Использует: {`{input_text}`}.</p>
                  <Textarea 
                    value={prompts.classifier} 
                    onChange={(e) => handlePromptChange('classifier', e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">1.2 Формирование цели и идеи</h3>
                  <p className="prompt-editor-block__desc">Предлагает научную цель и основной тезис на основе темы. Использует: {`{topic}`}.</p>
                  <Textarea 
                    value={prompts.suggest_details} 
                    onChange={(e) => handlePromptChange('suggest_details', e.target.value)}
                    rows={6}
                  />
                </div>
              </Stack>
            </div>

            {/* Блок 2: Планирование */}
            <div className="prompt-group">
              <h2 className="prompt-group__title">Блок 2: Планирование</h2>
              <Stack gap="xl">
                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">2.1 Генерация плана (структуры)</h3>
                  <p className="prompt-editor-block__desc">Создает содержание работы. Использует: {`{work_type}, {topic}, {goal}, {idea}, {volume}, {style}`}.</p>
                  <Textarea 
                    value={prompts.structure} 
                    onChange={(e) => handlePromptChange('structure', e.target.value)}
                    rows={8}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">2.2 Подбор источников литературы</h3>
                  <p className="prompt-editor-block__desc">Ищет реальные научные источники по ГОСТу. Использует: {`{work_type}, {topic}`}.</p>
                  <Textarea 
                    value={prompts.sources} 
                    onChange={(e) => handlePromptChange('sources', e.target.value)}
                    rows={8}
                  />
                </div>
              </Stack>
            </div>

            {/* Блок 3: Написание и обработка */}
            <div className="prompt-group">
              <h2 className="prompt-group__title">Блок 3: Написание и обработка</h2>
              <Stack gap="xl">
                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">3.1 Основная генерация контента</h3>
                  <p className="prompt-editor-block__desc">Пишет текст разделов. Использует: {`{section_title}, {topic}, {goal}, {idea}, {layout_instruction}, {previous_context_instruction}`}.</p>
                  <Textarea 
                    value={prompts.generation} 
                    onChange={(e) => handlePromptChange('generation', e.target.value)}
                    rows={10}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">3.2 Очеловечивание (Humanize)</h3>
                  <p className="prompt-editor-block__desc">Переписывает текст для обхода детекторов ИИ. Использует: {`{text}, {instructions}`}.</p>
                  <Textarea 
                    value={prompts.humanize} 
                    onChange={(e) => handlePromptChange('humanize', e.target.value)}
                    rows={8}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">3.3 Контроль качества (QC)</h3>
                  <p className="prompt-editor-block__desc">Финальная проверка стиля, логики и оформления. Использует: {`{text}`}.</p>
                  <Textarea 
                    value={prompts.qc} 
                    onChange={(e) => handlePromptChange('qc', e.target.value)}
                    rows={8}
                  />
                </div>
              </Stack>
            </div>

            {/* Блок 4: Служебные */}
            <div className="prompt-group">
              <h2 className="prompt-group__title">Блок 4: Служебные</h2>
              <Stack gap="xl">
                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">4.1 Данные для титульного листа</h3>
                  <p className="prompt-editor-block__desc">Дополняет информацию о ВУЗе и городе. Использует: {`{university_short}`}.</p>
                  <Textarea 
                    value={prompts.suggest_title_info} 
                    onChange={(e) => handlePromptChange('suggest_title_info', e.target.value)}
                    rows={6}
                  />
                </div>
              </Stack>
            </div>
          </Stack>
        </section>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-64)' }}>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleSave} 
          loading={isSaving}
          style={{ minWidth: '280px', height: '56px', fontSize: 'var(--font-size-base)' }}
        >
          Сохранить изменения
        </Button>
      </div>

      {showToast && (
        <div className="admin-alert-toast">
          <div className="admin-alert-toast__icon">✅</div>
          <div className="admin-alert-toast__text">Настройки успешно обновлены</div>
        </div>
      )}

      <style>{`
        .admin-tabs {
          display: flex;
          gap: var(--spacing-8);
          margin-bottom: var(--spacing-32);
          border-bottom: 1px solid var(--color-border-light);
          padding-bottom: var(--spacing-8);
        }
        .admin-tab {
          padding: var(--spacing-12) var(--spacing-24);
          background: transparent;
          border: none;
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--color-text-secondary);
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }
        .admin-tab:hover {
          background-color: var(--color-neutral-5);
          color: var(--color-neutral-100);
        }
        .admin-tab--active {
          background-color: var(--color-accent-base);
          color: white !important;
        }

        .prompt-group {
          padding: var(--spacing-32);
          background-color: var(--color-neutral-5);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border-light);
        }
        .prompt-group__title {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: var(--spacing-24);
          color: var(--color-neutral-100);
          border-left: 4px solid var(--color-accent-base);
          padding-left: var(--spacing-16);
        }

        .prompt-editor-block {
          background: white;
          padding: var(--spacing-24);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border-base);
          box-shadow: var(--elevation-1);
        }
        .prompt-editor-block__title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--color-neutral-100);
        }
        .prompt-editor-block__desc {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-16);
          line-height: 1.4;
        }

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
