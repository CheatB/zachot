import React, { useState, useEffect } from 'react';
import { Button, Stack, Card } from '@/ui';
import { fetchModelRouting, saveModelRouting, type FullModelRoutingConfig } from '@/shared/api/admin';

const modelOptions = [
  { value: 'openai/o3', label: 'o3 (Reasoning High)' },
  { value: 'openai/o1', label: 'o1 (Reasoning Mid)' },
  { value: 'openai/gpt-4o', label: 'gpt-4o (Standard)' },
  { value: 'openai/gpt-4o-mini', label: 'gpt-4o-mini (Economy)' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1 (Reasoning)' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
  { value: 'perplexity/sonar-pro', label: 'Sonar Pro (Search)' },
  { value: 'perplexity/sonar-deep-research', label: 'Deep Research' },
];

const fallbackOptions = [
  { value: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free)' },
  { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)' },
  { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)' },
  { value: 'open-orca/mistral-7b-openorca:free', label: 'OpenOrca 7B (Free)' },
];

const modelDescriptions = {
  main: [
    { name: 'o3 / o1', strengths: 'Железная логика, исключительное качество планирования сложных работ.', weaknesses: 'Дорого и медленно (до 30 сек на ответ).', recommended: 'Лучший выбор для этапов "Цель и Идея" и "План работы".' },
    { name: 'gpt-4o', strengths: 'Золотой стандарт. Идеальный баланс качества текста и скорости.', weaknesses: 'Средняя цена.', recommended: 'Для основного написания текста (курсовые, статьи).' },
    { name: 'Claude 3.5 Sonnet', strengths: 'Самый "человечный" и живой язык. Понимает тончайшие нюансы ТЗ.', weaknesses: 'Частые отказы по цензуре.', recommended: 'Незаменим для этапа "Очеловечивание" и эссе.' },
    { name: 'DeepSeek R1', strengths: 'Умный расчет и математика на уровне o1.', weaknesses: 'Может тормозить в пиковые часы.', recommended: 'Для решения сложных задач.' },
    { name: 'Perplexity Sonar', strengths: 'Прямой доступ к свежим научным статьям и новостям.', weaknesses: 'Не умеет писать длинные связные тексты.', recommended: 'Использовать ТОЛЬКО на этапе "Источники".' },
  ],
  fallback: [
    { name: 'Gemini 2.0 Flash', strengths: 'Молниеносная скорость и огромное окно контекста.', weaknesses: 'Иногда слишком краткие ответы.', recommended: 'Идеальный резерв для генерации длинных текстов.' },
    { name: 'Mistral 7B', strengths: 'Очень стабильная и предсказуемая.', weaknesses: 'Скромная логика.', recommended: 'Резерв для структуры и коротких докладов.' },
    { name: 'Llama 3.1 8B', strengths: 'Хорошее знание русского языка среди малых моделей.', weaknesses: 'Склонность к повторам.', recommended: 'Резерв для стиля и правок.' },
  ]
};

const ModelRoutingPage: React.FC = () => {
  const [config, setConfig] = useState<FullModelRoutingConfig | null>(null);
  const [isSaving, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchModelRouting().then(setConfig);
  }, []);

  const handleModelChange = (type: 'main' | 'fallback', workType: string, stage: string, model: string) => {
    if (!config) return;
    setConfig((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [type]: {
          ...prev[type],
          [workType]: {
            ...prev[type][workType],
            [stage]: model
          }
        }
      };
    });
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

  const ModelSelect = ({ type, workType, stage, options }: { type: 'main' | 'fallback', workType: string, stage: string, options: { value: string, label: string }[] }) => (
    <div className="admin-select-wrapper">
      <select 
        className="admin-select-minimal"
        value={config[type]?.[workType]?.[stage] || ''}
        onChange={(e) => handleModelChange(type, workType, stage, e.target.value)}
      >
        {options.map(opt => (
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
          Управление основным интеллектом системы и аварийным режимом.
        </p>
      </header>

      <section className="routing-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--spacing-24)' }}>
          <h2 className="routing-section__title" style={{ marginBottom: 0 }}>Основные модели</h2>
          <span className="admin-badge admin-badge--primary">Активный режим</span>
        </div>
        
        <div className="admin-table-container">
          <table className="admin-table-v2">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Вид работы</th>
                <th>Цель и Идея</th>
                <th>План работы</th>
                <th>Источники</th>
                <th>Написание текста</th>
                <th>Очеловечивание</th>
              </tr>
            </thead>
            <tbody>
              {['referat', 'kursach', 'essay', 'doklad', 'article', 'composition', 'other'].map(wt => (
                <tr key={wt}>
                  <td>{wt === 'referat' ? 'Реферат' : wt === 'kursach' ? 'Курсовая' : wt === 'essay' ? 'Эссе' : wt === 'doklad' ? 'Доклад' : wt === 'article' ? 'Статья' : wt === 'composition' ? 'Сочинение' : 'Другое'}</td>
                  <td><ModelSelect type="main" workType={wt} stage="suggest_details" options={modelOptions} /></td>
                  <td><ModelSelect type="main" workType={wt} stage="structure" options={modelOptions} /></td>
                  <td><ModelSelect type="main" workType={wt} stage="sources" options={modelOptions} /></td>
                  <td><ModelSelect type="main" workType={wt} stage="generation" options={modelOptions} /></td>
                  <td><ModelSelect type="main" workType={wt} stage="refine" options={modelOptions} /></td>
                </tr>
              ))}
              <tr>
                <td>Презентация</td>
                <td><ModelSelect type="main" workType="presentation" stage="suggest_details" options={modelOptions} /></td>
                <td><ModelSelect type="main" workType="presentation" stage="structure" options={modelOptions} /></td>
                <td><ModelSelect type="main" workType="presentation" stage="sources" options={modelOptions} /></td>
                <td><ModelSelect type="main" workType="presentation" stage="generation" options={modelOptions} /></td>
                <td><ModelSelect type="main" workType="presentation" stage="refine" options={modelOptions} /></td>
              </tr>
              <tr>
                <td>Решение задач</td>
                <td colSpan={5}><ModelSelect type="main" workType="task" stage="task_solve" options={modelOptions} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="routing-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--spacing-24)' }}>
          <h2 className="routing-section__title" style={{ marginBottom: 0 }}>Резервные модели (Fallback)</h2>
          <span className="admin-badge admin-badge--secondary">При ошибке или 0 балансе</span>
        </div>
        
        <div className="admin-table-container">
          <table className="admin-table-v2">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Процесс</th>
                <th>Цель и Идея</th>
                <th>План работы</th>
                <th>Источники</th>
                <th>Написание текста</th>
                <th>Очеловечивание / Стиль</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Все текстовые работы</td>
                <td><ModelSelect type="fallback" workType="text" stage="suggest_details" options={fallbackOptions} /></td>
                <td><ModelSelect type="fallback" workType="text" stage="structure" options={fallbackOptions} /></td>
                <td><ModelSelect type="fallback" workType="text" stage="sources" options={fallbackOptions} /></td>
                <td><ModelSelect type="fallback" workType="text" stage="generation" options={fallbackOptions} /></td>
                <td><ModelSelect type="fallback" workType="text" stage="refine" options={fallbackOptions} /></td>
              </tr>
              <tr>
                <td>Презентации</td>
                <td><ModelSelect type="fallback" workType="presentation" stage="suggest_details" options={fallbackOptions} /></td>
                <td><ModelSelect type="fallback" workType="presentation" stage="structure" options={fallbackOptions} /></td>
                <td><ModelSelect type="fallback" workType="presentation" stage="sources" options={fallbackOptions} /></td>
                <td><ModelSelect type="fallback" workType="presentation" stage="generation" options={fallbackOptions} /></td>
                <td><ModelSelect type="fallback" workType="presentation" stage="refine" options={fallbackOptions} /></td>
              </tr>
              <tr>
                <td>Решение задач</td>
                <td colSpan={5}><ModelSelect type="fallback" workType="task" stage="task_solve" options={fallbackOptions} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="routing-section">
        <h2 className="routing-section__title">Гайд по выбору моделей</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <Stack gap="lg">
            <h3 style={{ color: 'var(--color-accent-base)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💎 Основные (Premium)
            </h3>
            {modelDescriptions.main.map(m => (
              <Card key={m.name} style={{ padding: '20px', borderLeft: '4px solid var(--color-accent-base)' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>{m.name}</div>
                <Stack gap="xs">
                  <div style={{ fontSize: '13px' }}><strong>Сила:</strong> {m.strengths}</div>
                  <div style={{ fontSize: '13px' }}><strong>Слабость:</strong> {m.weaknesses}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-accent-base)', fontWeight: 'medium' }}>🎯 {m.recommended}</div>
                </Stack>
              </Card>
            ))}
          </Stack>
          <Stack gap="lg">
            <h3 style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛡️ Резервные (Free)
            </h3>
            {modelDescriptions.fallback.map(m => (
              <Card key={m.name} style={{ padding: '20px', borderLeft: '4px solid var(--color-text-disabled)' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>{m.name}</div>
                <Stack gap="xs">
                  <div style={{ fontSize: '13px' }}><strong>Сила:</strong> {m.strengths}</div>
                  <div style={{ fontSize: '13px' }}><strong>Слабость:</strong> {m.weaknesses}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 'medium' }}>🎯 {m.recommended}</div>
                </Stack>
              </Card>
            ))}
          </Stack>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-64)', paddingBottom: 'var(--spacing-80)' }}>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleSave} 
          loading={isSaving}
          style={{ minWidth: '280px', height: '56px', fontSize: 'var(--font-size-base)' }}
        >
          Сохранить все настройки
        </Button>
      </div>

      {showToast && (
        <div className="admin-alert-toast">
          <div className="admin-alert-toast__icon">✅</div>
          <div className="admin-alert-toast__text">Настройки роутинга успешно сохранены</div>
        </div>
      )}

      <style>{`
        .routing-section {
          margin-bottom: var(--spacing-64);
        }
        .routing-section__title {
          font-size: var(--font-size-xl);
          color: var(--color-neutral-100);
          margin-bottom: var(--spacing-24);
          padding-left: var(--spacing-8);
          border-left: 4px solid var(--color-accent-base);
        }
        .admin-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: bold;
        }
        .admin-badge--primary { background: var(--color-accent-light); color: var(--color-accent-base); }
        .admin-badge--secondary { background: var(--color-neutral-20); color: var(--color-text-secondary); }

        .admin-table-container {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border-light);
          overflow: hidden;
          box-shadow: var(--elevation-1);
        }
        .admin-table-v2 {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table-v2 th {
          padding: var(--spacing-16) var(--spacing-24);
          background: var(--color-neutral-10);
          color: var(--color-text-secondary);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--color-border-light);
          text-align: left;
        }
        .admin-table-v2 td {
          padding: var(--spacing-16) var(--spacing-24);
          border-bottom: 1px solid var(--color-border-light);
          font-size: 14px;
        }
        
        .admin-select-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          width: 100%;
        }
        .admin-select-minimal {
          appearance: none;
          background: var(--color-neutral-10);
          border: 1px solid var(--color-border-light);
          border-radius: 6px;
          color: var(--color-neutral-100);
          font-size: 12px;
          padding: 6px 24px 6px 10px;
          cursor: pointer;
          width: 100%;
          outline: none;
          transition: all 0.2s ease;
        }
        .admin-select-minimal:hover {
          border-color: var(--color-accent-base);
          background: white;
        }
        .admin-select-arrow {
          position: absolute;
          right: 8px;
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
      `}</style>
    </Stack>
  );
};

export default ModelRoutingPage;
