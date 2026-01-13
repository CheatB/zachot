import React, { useState, useEffect } from 'react';
import { Card, Stack, Button, Badge } from '@/ui';
import { fetchModelRouting, saveModelRouting, fetchPrompts, savePrompts, type ModelRoutingConfig, type PromptConfig } from '@/shared/api/admin';
import styles from './ModelRoutingPage.module.css';

const ModelRoutingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'routing' | 'prompts'>('routing');
  const [config, setConfig] = useState<ModelRoutingConfig | null>(null);
  const [prompts, setPrompts] = useState<PromptConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [routingData, promptsData] = await Promise.all([
        fetchModelRouting(),
        fetchPrompts()
      ]);
      setConfig(routingData);
      setPrompts(promptsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const handleRoutingChange = (type: 'main' | 'fallback', key: string, stage: string, value: string) => {
    if (!config) return;
    const newConfig = { ...config };
    if (type === 'main') {
      newConfig.main[key] = { ...newConfig.main[key], [stage]: value };
    } else {
      newConfig.fallback[key] = { ...newConfig.fallback[key], [stage]: value };
    }
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handlePromptChange = (name: string, value: string) => {
    if (!prompts) return;
    setPrompts({ ...prompts, [name]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!config || !prompts) return;
    setIsSaving(true);
    try {
      await Promise.all([
        saveModelRouting(config),
        savePrompts(prompts)
      ]);
      setHasChanges(false);
      alert('Настройки успешно сохранены');
    } catch (error) {
      alert('Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const modelOptions = [
    { value: 'openai/gpt-4o', label: 'GPT-4o (Умная, Дорогая)' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Быстрая, Дешевая)' },
    { value: 'anthropic/claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'google/gemini-pro-1.5', label: 'Gemini 1.5 Pro' },
    { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat (Дешевая)' },
    { value: 'free/gpt-3.5-turbo', label: 'Free GPT-3.5' },
    { value: 'free/llama-3-70b', label: 'Free Llama 3 70B' }
  ];

  if (!config || !prompts) return <div>Загрузка...</div>;

  return (
    <div className={styles.adminPage}>
      <header style={{ marginBottom: 'var(--spacing-32)' }}>
        <h1 style={{ color: 'var(--color-neutral-100)' }}>Панель управления AI</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Настройка моделей и промптов системы «Зачёт»</p>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'routing' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('routing')}
        >
          Роутинг моделей
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'prompts' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          Управление промптами
        </button>
      </div>

      {activeTab === 'routing' && (
        <Stack gap="xl">
          <section className={styles.modelCategory}>
            <h3>
              Основные модели (Main)
              <Badge status="success">Active</Badge>
            </h3>
            <p className={styles.helpText}>Модели, используемые по умолчанию для каждого типа работы и этапа генерации.</p>
            
            <Card style={{ padding: 0 }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Тип работы</th>
                    <th>Структура</th>
                    <th>Источники</th>
                    <th>Контент</th>
                    <th>Оформление</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(config.main).map(([workType, stages]) => (
                    <tr key={workType}>
                      <td style={{ fontWeight: 'bold' }}>{workType}</td>
                      <td>
                        <select 
                          className={styles.select}
                          value={stages.structure}
                          onChange={(e) => handleRoutingChange('main', workType, 'structure', e.target.value)}
                        >
                          {modelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <select 
                          className={styles.select}
                          value={stages.sources}
                          onChange={(e) => handleRoutingChange('main', workType, 'sources', e.target.value)}
                        >
                          {modelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <select 
                          className={styles.select}
                          value={stages.content}
                          onChange={(e) => handleRoutingChange('main', workType, 'content', e.target.value)}
                        >
                          {modelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <select 
                          className={styles.select}
                          value={stages.formatting || 'openai/gpt-4o-mini'}
                          onChange={(e) => handleRoutingChange('main', workType, 'formatting', e.target.value)}
                        >
                          {modelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>

          <section className={styles.modelCategory}>
            <h3>
              Резервные модели (Fallback)
              <Badge status="warn">Backup</Badge>
            </h3>
            <p className={styles.helpText}>Эти модели будут использованы автоматически, если основная модель вернет ошибку или будет недоступна.</p>
            
            <Card style={{ padding: 0 }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Категория</th>
                    <th>Структура</th>
                    <th>Источники</th>
                    <th>Контент</th>
                    <th>Оформление</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(config.fallback).map(([category, stages]) => (
                    <tr key={category}>
                      <td style={{ fontWeight: 'bold' }}>{category}</td>
                      <td>
                        <select 
                          className={styles.select}
                          value={stages.structure}
                          onChange={(e) => handleRoutingChange('fallback', category, 'structure', e.target.value)}
                        >
                          {modelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <select 
                          className={styles.select}
                          value={stages.sources}
                          onChange={(e) => handleRoutingChange('fallback', category, 'sources', e.target.value)}
                        >
                          {modelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <select 
                          className={styles.select}
                          value={stages.content}
                          onChange={(e) => handleRoutingChange('fallback', category, 'content', e.target.value)}
                        >
                          {modelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <select 
                          className={styles.select}
                          value={stages.formatting || 'deepseek/deepseek-chat'}
                          onChange={(e) => handleRoutingChange('fallback', category, 'formatting', e.target.value)}
                        >
                          {modelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>
        </Stack>
      )}

      {activeTab === 'prompts' && (
        <Stack gap="xl">
          <div className={styles.promptGroup}>
            <h3>Анализ и подготовка</h3>
            <div className={styles.promptCard}>
              <label style={{ fontWeight: 'bold', display: 'block' }}>Suggest Details (Цель и Идея)</label>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Используется на шаге «Уточним детали работы» для генерации цели и идеи по теме.
              </p>
              <textarea 
                className={styles.textarea}
                value={prompts.suggest_details}
                onChange={(e) => handlePromptChange('suggest_details', e.target.value)}
              />
            </div>
            
            <div className={styles.promptCard}>
              <label style={{ fontWeight: 'bold', display: 'block' }}>Suggest Structure (План работы)</label>
              <textarea 
                className={styles.textarea}
                value={prompts.suggest_structure}
                onChange={(e) => handlePromptChange('suggest_structure', e.target.value)}
              />
            </div>

            <div className={styles.promptCard}>
              <label style={{ fontWeight: 'bold', display: 'block' }}>Suggest Sources (Литература)</label>
              <textarea 
                className={styles.textarea}
                value={prompts.suggest_sources}
                onChange={(e) => handlePromptChange('suggest_sources', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.promptGroup}>
            <h3>Планирование</h3>
            <div className={styles.promptCard}>
              <label style={{ fontWeight: 'bold', display: 'block' }}>Structure Analysis (Внутренний)</label>
              <textarea 
                className={styles.textarea}
                value={prompts.structure}
                onChange={(e) => handlePromptChange('structure', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.promptGroup}>
            <h3>Написание и обработка</h3>
            <div className={styles.promptCard}>
              <label style={{ fontWeight: 'bold', display: 'block' }}>Content Generation (Главы)</label>
              <textarea 
                className={styles.textarea}
                value={prompts.content}
                onChange={(e) => handlePromptChange('content', e.target.value)}
              />
            </div>
            <div className={styles.promptCard}>
              <label style={{ fontWeight: 'bold', display: 'block' }}>Humanization (Очеловечивание)</label>
              <textarea 
                className={styles.textarea}
                value={prompts.humanize}
                onChange={(e) => handlePromptChange('humanize', e.target.value)}
              />
            </div>
            <div className={styles.promptCard}>
              <label style={{ fontWeight: 'bold', display: 'block' }}>Formatting (Оформление)</label>
              <textarea 
                className={styles.textarea}
                value={prompts.formatting}
                onChange={(e) => handlePromptChange('formatting', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.promptGroup}>
            <h3>Служебные</h3>
            <div className={styles.promptCard}>
              <label style={{ fontWeight: 'bold', display: 'block' }}>Quality Control</label>
              <textarea 
                className={styles.textarea}
                value={prompts.qc}
                onChange={(e) => handlePromptChange('qc', e.target.value)}
              />
            </div>
            <div className={styles.promptCard}>
              <label style={{ fontWeight: 'bold', display: 'block' }}>Title Info (ВУЗы и Города)</label>
              <textarea 
                className={styles.textarea}
                value={prompts.suggest_title_info}
                onChange={(e) => handlePromptChange('suggest_title_info', e.target.value)}
              />
            </div>
          </div>
        </Stack>
      )}

      {hasChanges && (
        <div className={styles.saveBar}>
          <Button 
            variant="primary" 
            size="lg" 
            loading={isSaving}
            onClick={handleSave}
          >
            Сохранить все изменения
          </Button>
        </div>
      )}
    </div>
  );
};

export default ModelRoutingPage;
