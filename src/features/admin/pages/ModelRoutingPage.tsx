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
  { value: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free)' },
  { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)' },
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

  const handleModelChange = (section: 'main' | 'fallback', workType: string, stage: string, model: string) => {
    if (!config) return;
    setConfig(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [workType]: {
          ...prev![section][workType],
          [stage]: model
        }
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

  const ModelSelect = ({ section, workType, stage }: { section: 'main' | 'fallback', workType: string, stage: string }) => (
    <div className="admin-select-wrapper">
      <select 
        className="admin-select-minimal"
        value={config[section]?.[workType]?.[stage] || ''}
        onChange={(e) => handleModelChange(section, workType, stage, e.target.value)}
      >
        <option value="">(Автовыбор)</option>
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
            <h2 className="routing-section__title">Основные модели (Main)</h2>
            <p className="routing-section__desc">Используются при штатной работе системы.</p>
            
            <div className="admin-subsection">
              <h3 className="admin-subsection__title">Текстовые работы</h3>
              <div className="admin-table-container">
                <table className="admin-table-v2">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Вид работы</th>
                      <th>Цель и Идея</th>
                      <th>План работы</th>
                      <th>Источники</th>
                      <th>Текст</th>
                      <th>Очеловечивание</th>
                      <th>Оформление</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['referat', 'kursach', 'essay', 'doklad', 'article', 'composition', 'other'].map(type => (
                      <tr key={type}>
                        <td>{type.charAt(0).toUpperCase() + type.slice(1)}</td>
                        <td><ModelSelect section="main" workType={type} stage="suggest_details" /></td>
                        <td><ModelSelect section="main" workType={type} stage="structure" /></td>
                        <td><ModelSelect section="main" workType={type} stage="sources" /></td>
                        <td><ModelSelect section="main" workType={type} stage="generation" /></td>
                        <td><ModelSelect section="main" workType={type} stage="editor" /></td>
                        <td><ModelSelect section="main" workType={type} stage="formatting" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-subsection">
              <h3 className="admin-subsection__title">Презентации</h3>
              <div className="admin-table-container">
                <table className="admin-table-v2">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Вид работы</th>
                      <th>Цель и Идея</th>
                      <th>План работы</th>
                      <th>Источники</th>
                      <th>Слайды</th>
                      <th>Визуальный стиль</th>
                      <th>Оформление</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Презентация</td>
                      <td><ModelSelect section="main" workType="presentation" stage="suggest_details" /></td>
                      <td><ModelSelect section="main" workType="presentation" stage="structure" /></td>
                      <td><ModelSelect section="main" workType="presentation" stage="sources" /></td>
                      <td><ModelSelect section="main" workType="presentation" stage="generation" /></td>
                      <td><ModelSelect section="main" workType="presentation" stage="editor" /></td>
                      <td><ModelSelect section="main" workType="presentation" stage="formatting" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-subsection">
              <h3 className="admin-subsection__title">Решение задач</h3>
              <div className="admin-table-container">
                <table className="admin-table-v2">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Вид работы</th>
                      <th>Решение задачи</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Задача</td>
                      <td><ModelSelect section="main" workType="task" stage="task_solve" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="routing-section routing-section--fallback">
            <h2 className="routing-section__title">Резервные модели (Fallback)</h2>
            <p className="routing-section__desc">Используются автоматически, если основные модели недоступны.</p>
            
            <div className="admin-table-container">
              <table className="admin-table-v2">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Категория</th>
                    <th>План</th>
                    <th>Цель/Идея</th>
                    <th>Источники</th>
                    <th>Текст/Слайды</th>
                    <th>Редактор</th>
                    <th>Оформление</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Текстовые работы</td>
                    <td><ModelSelect section="fallback" workType="text" stage="structure" /></td>
                    <td><ModelSelect section="fallback" workType="text" stage="suggest_details" /></td>
                    <td><ModelSelect section="fallback" workType="text" stage="sources" /></td>
                    <td><ModelSelect section="fallback" workType="text" stage="generation" /></td>
                    <td><ModelSelect section="fallback" workType="text" stage="editor" /></td>
                    <td><ModelSelect section="fallback" workType="text" stage="formatting" /></td>
                  </tr>
                  <tr>
                    <td>Презентации</td>
                    <td><ModelSelect section="fallback" workType="presentation" stage="structure" /></td>
                    <td><ModelSelect section="fallback" workType="presentation" stage="suggest_details" /></td>
                    <td><ModelSelect section="fallback" workType="presentation" stage="sources" /></td>
                    <td><ModelSelect section="fallback" workType="presentation" stage="generation" /></td>
                    <td><ModelSelect section="fallback" workType="presentation" stage="editor" /></td>
                    <td><ModelSelect section="fallback" workType="presentation" stage="formatting" /></td>
                  </tr>
                  <tr>
                    <td>Задачи</td>
                    <td colSpan={6}><ModelSelect section="fallback" workType="task" stage="task_solve" /></td>
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
                  <h3 className="prompt-editor-block__title">1.1 Классификатор (classifier)</h3>
                  <p className="prompt-editor-block__desc">Определяет категорию запроса (academic/task/chat). Использует: {`{input_text}`}.</p>
                  <Textarea 
                    value={prompts.classifier || ''} 
                    onChange={(e) => handlePromptChange('classifier', e.target.value)}
                    rows={8}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">1.2 Формирование цели и идеи (suggest_details)</h3>
                  <p className="prompt-editor-block__desc">Предлагает научную цель и тезис. Использует: {`{module}, {topic}, {complexity}, {humanity}`}.</p>
                  <Textarea 
                    value={prompts.suggest_details || ''} 
                    onChange={(e) => handlePromptChange('suggest_details', e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">1.3 Генерация структуры (suggest_structure)</h3>
                  <p className="prompt-editor-block__desc">Создает план работы с главами и разделами. Использует: {`{module}, {work_type}, {topic}, {goal}, {idea}, {volume}, {complexity}, {humanity}, {style}`}.</p>
                  <Textarea 
                    value={prompts.suggest_structure || ''} 
                    onChange={(e) => handlePromptChange('suggest_structure', e.target.value)}
                    rows={8}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">1.4 Информация о ВУЗе (suggest_title_info)</h3>
                  <p className="prompt-editor-block__desc">Находит полные реквизиты университета. Использует: {`{university_short}`}.</p>
                  <Textarea 
                    value={prompts.suggest_title_info || ''} 
                    onChange={(e) => handlePromptChange('suggest_title_info', e.target.value)}
                    rows={4}
                  />
                </div>
              </Stack>
            </div>

            {/* Блок 2: Поиск источников */}
            <div className="prompt-group">
              <h2 className="prompt-group__title">Блок 2: Поиск источников</h2>
              <Stack gap="xl">
                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">2.1 Подбор источников (sources)</h3>
                  <p className="prompt-editor-block__desc">Ищет РЕАЛЬНЫЕ научные источники через Perplexity. Использует: {`{topic}, {goal}, {idea}, {complexity}`}.</p>
                  <Textarea 
                    value={prompts.sources || ''} 
                    onChange={(e) => handlePromptChange('sources', e.target.value)}
                    rows={12}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">2.2 Контроль качества источников (sources_qc)</h3>
                  <p className="prompt-editor-block__desc">Проверяет релевантность найденных источников. Использует: {`{topic}, {goal}, {idea}, {sources_list}`}.</p>
                  <Textarea 
                    value={prompts.sources_qc || ''} 
                    onChange={(e) => handlePromptChange('sources_qc', e.target.value)}
                    rows={10}
                  />
                </div>
              </Stack>
            </div>

            {/* Блок 3: Генерация контента */}
            <div className="prompt-group">
              <h2 className="prompt-group__title">Блок 3: Генерация контента</h2>
              <Stack gap="xl">
                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">3.1 Генерация текста (content)</h3>
                  <p className="prompt-editor-block__desc">
                    Пишет текст разделов для ТЕКСТОВЫХ работ (курсовые, рефераты, дипломы).<br/>
                    <strong>⚠️ Генерируется ОТДЕЛЬНО для каждой главы!</strong><br/>
                    Использует: {`{section_title}, {topic}, {module}, {work_type}, {goal}, {idea}, {complexity}, {humanity}, {volume_pages}, {volume_words}, {volume_chars}, {previous_context_instruction}, {layout_instruction}`}.<br/>
                    <strong>Возвращает:</strong> Чистый текст раздела (БЕЗ JSON).
                  </p>
                  <Textarea 
                    value={prompts.content || ''} 
                    onChange={(e) => handlePromptChange('content', e.target.value)}
                    rows={12}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">3.2 Генерация презентаций (generation)</h3>
                  <p className="prompt-editor-block__desc">
                    Создает слайды для ПРЕЗЕНТАЦИЙ в JSON формате.<br/>
                    <strong>⚠️ Генерируется ВСЯ презентация за один запрос (не по слайдам)!</strong><br/>
                    Использует: {`{section_title}, {topic}, {module}, {work_type}, {goal}, {idea}, {complexity}, {humanity}, {volume_pages}, {volume_words}, {layout_instruction}, {previous_context_instruction}`}.<br/>
                    <strong>Возвращает:</strong> JSON с полями content, layout, icons, visual_meta, image_prompt.
                  </p>
                  <Textarea 
                    value={prompts.generation || ''} 
                    onChange={(e) => handlePromptChange('generation', e.target.value)}
                    rows={10}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">3.3 Решение задач (task_solve)</h3>
                  <p className="prompt-editor-block__desc">
                    Решает академические задачи с подробным объяснением.<br/>
                    <strong>⚠️ Генерируется ВСЯ задача за один запрос!</strong><br/>
                    Использует: {`{task_text}, {complexity}, {subject}`}.<br/>
                    <strong>Возвращает:</strong> Текст с пошаговым решением.
                  </p>
                  <Textarea 
                    value={prompts.task_solve || ''} 
                    onChange={(e) => handlePromptChange('task_solve', e.target.value)}
                    rows={10}
                  />
                </div>
              </Stack>
            </div>

            {/* Блок 4: Редактор текста */}
            <div className="prompt-group">
              <h2 className="prompt-group__title">Блок 4: Редактор текста</h2>
              <Stack gap="xl">
                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">4.1 Переписать (editor_rewrite)</h3>
                  <p className="prompt-editor-block__desc">Переписывает текст, сохраняя смысл. Использует: {`{text}, {context}`}.</p>
                  <Textarea 
                    value={typeof prompts.editor_rewrite === 'string' ? prompts.editor_rewrite : JSON.stringify(prompts.editor_rewrite || {}, null, 2)} 
                    onChange={(e) => handlePromptChange('editor_rewrite', e.target.value)}
                    rows={6}
                    placeholder='{"system": "...", "user_template": "..."}'
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">4.2 Сократить (editor_shorter)</h3>
                  <p className="prompt-editor-block__desc">Сокращает текст на 30-50%. Использует: {`{text}, {context}`}.</p>
                  <Textarea 
                    value={typeof prompts.editor_shorter === 'string' ? prompts.editor_shorter : JSON.stringify(prompts.editor_shorter || {}, null, 2)} 
                    onChange={(e) => handlePromptChange('editor_shorter', e.target.value)}
                    rows={6}
                    placeholder='{"system": "...", "user_template": "..."}'
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">4.3 Расширить (editor_longer)</h3>
                  <p className="prompt-editor-block__desc">Расширяет текст, добавляя детали. Использует: {`{text}, {context}`}.</p>
                  <Textarea 
                    value={typeof prompts.editor_longer === 'string' ? prompts.editor_longer : JSON.stringify(prompts.editor_longer || {}, null, 2)} 
                    onChange={(e) => handlePromptChange('editor_longer', e.target.value)}
                    rows={8}
                    placeholder='{"system": "...", "user_template": "..."}'
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">4.4 Произвольная команда (editor_custom)</h3>
                  <p className="prompt-editor-block__desc">Выполняет произвольные команды пользователя. Использует: {`{context}, {instruction}`}.</p>
                  <Textarea 
                    value={typeof prompts.editor_custom === 'string' ? prompts.editor_custom : JSON.stringify(prompts.editor_custom || {}, null, 2)} 
                    onChange={(e) => handlePromptChange('editor_custom', e.target.value)}
                    rows={6}
                    placeholder='{"system": "...", "user_template": "..."}'
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">4.5 Генерация графика (editor_generate_chart)</h3>
                  <p className="prompt-editor-block__desc">Создает текстовое описание графика. Использует: {`{context}`}.</p>
                  <Textarea 
                    value={typeof prompts.editor_generate_chart === 'string' ? prompts.editor_generate_chart : JSON.stringify(prompts.editor_generate_chart || {}, null, 2)} 
                    onChange={(e) => handlePromptChange('editor_generate_chart', e.target.value)}
                    rows={6}
                    placeholder='{"system": "...", "user_template": "..."}'
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">4.6 Генерация таблицы (editor_generate_table)</h3>
                  <p className="prompt-editor-block__desc">Создает таблицу на основе контекста. Использует: {`{context}`}.</p>
                  <Textarea 
                    value={typeof prompts.editor_generate_table === 'string' ? prompts.editor_generate_table : JSON.stringify(prompts.editor_generate_table || {}, null, 2)} 
                    onChange={(e) => handlePromptChange('editor_generate_table', e.target.value)}
                    rows={6}
                    placeholder='{"system": "...", "user_template": "..."}'
                  />
                </div>
              </Stack>
            </div>

            {/* Блок 5: Очеловечивание (5 уровней) */}
            <div className="prompt-group">
              <h2 className="prompt-group__title">Блок 5: Очеловечивание (Anti-AI)</h2>
              <Stack gap="xl">
                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">5.1 Уровень 0 - Строгий AI-стиль (humanize_0)</h3>
                  <p className="prompt-editor-block__desc">Без очеловечивания, максимально структурированный текст. Использует: {`{text}`}.</p>
                  <Textarea 
                    value={prompts.humanize_0 || ''} 
                    onChange={(e) => handlePromptChange('humanize_0', e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">5.2 Уровень 25 - Легкое сглаживание (humanize_25)</h3>
                  <p className="prompt-editor-block__desc">Удаление очевидных AI-маркеров, базовое разнообразие. Использует: {`{text}`}.</p>
                  <Textarea 
                    value={prompts.humanize_25 || ''} 
                    onChange={(e) => handlePromptChange('humanize_25', e.target.value)}
                    rows={8}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">5.3 Уровень 50 - Естественный стиль (humanize_50)</h3>
                  <p className="prompt-editor-block__desc">Разнообразие синтаксиса, удаление канцеляризмов. Использует: {`{text}`}.</p>
                  <Textarea 
                    value={prompts.humanize_50 || ''} 
                    onChange={(e) => handlePromptChange('humanize_50', e.target.value)}
                    rows={10}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">5.4 Уровень 75 - Авторский почерк (humanize_75)</h3>
                  <p className="prompt-editor-block__desc">Авторская модальность, неравномерный ритм, сложный синтаксис. Использует: {`{text}`}.</p>
                  <Textarea 
                    value={prompts.humanize_75 || ''} 
                    onChange={(e) => handlePromptChange('humanize_75', e.target.value)}
                    rows={12}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">5.5 Уровень 100 - Anti-AI Maximum (humanize_100)</h3>
                  <p className="prompt-editor-block__desc">Максимальная имитация живого автора, рваный ритм, инверсии. Использует: {`{text}`}.</p>
                  <Textarea 
                    value={prompts.humanize_100 || ''} 
                    onChange={(e) => handlePromptChange('humanize_100', e.target.value)}
                    rows={15}
                  />
                </div>
              </Stack>
            </div>

            {/* Блок 6: Оформление и контроль качества */}
            <div className="prompt-group">
              <h2 className="prompt-group__title">Блок 6: Оформление и контроль качества</h2>
              <Stack gap="xl">
                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">6.1 Оформление по ГОСТ (formatting)</h3>
                  <p className="prompt-editor-block__desc">Приводит текст к стандарту ГОСТ. Использует: {`{fontFamily}, {fontSize}, {lineSpacing}, {margins}, {text}`}.</p>
                  <Textarea 
                    value={prompts.formatting || ''} 
                    onChange={(e) => handlePromptChange('formatting', e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">6.2 Контроль качества (qc)</h3>
                  <p className="prompt-editor-block__desc">Финальная проверка логики и стиля. Использует: {`{text}`}.</p>
                  <Textarea 
                    value={prompts.qc || ''} 
                    onChange={(e) => handlePromptChange('qc', e.target.value)}
                    rows={6}
                  />
                </div>
              </Stack>
            </div>

            {/* Блок 7: Служебные */}
            <div className="prompt-group">
              <h2 className="prompt-group__title">Блок 4: Служебные</h2>
              <Stack gap="xl">
                <div className="prompt-editor-block">
                  <h3 className="prompt-editor-block__title">4.1 Данные для титульного листа</h3>
                  <p className="prompt-editor-block__desc">Дополняет информацию о ВУЗе. Использует: {`{university_short}`}.</p>
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
        .routing-section--fallback {
          padding-top: var(--spacing-48);
          border-top: 2px dashed var(--color-border-light);
        }
        .routing-section__title {
          font-size: var(--font-size-xl);
          color: var(--color-neutral-100);
          margin-bottom: var(--spacing-8);
          padding-left: var(--spacing-8);
          border-left: 4px solid var(--color-accent-base);
        }
        .routing-section__desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-24);
          padding-left: var(--spacing-24);
        }

        .admin-subsection {
          margin-bottom: var(--spacing-32);
          padding-left: var(--spacing-24);
        }
        .admin-subsection__title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: var(--spacing-16);
          color: var(--color-neutral-90);
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
