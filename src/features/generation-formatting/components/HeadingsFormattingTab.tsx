import { Input } from '@/ui'
import type { FormattingSettings } from '@/features/create-generation/types'

interface HeadingsFormattingTabProps {
  formatting: FormattingSettings
  onChange: (formatting: FormattingSettings) => void
}

function HeadingsFormattingTab({ formatting, onChange }: HeadingsFormattingTabProps) {
  const handleHeadingChange = (
    level: 'h1' | 'h2' | 'h3',
    field: keyof FormattingSettings['headings']['h1'],
    value: any
  ) => {
    onChange({
      ...formatting,
      headings: {
        ...formatting.headings,
        [level]: {
          ...formatting.headings[level],
          [field]: value,
        },
      },
    })
  }

  const renderHeadingSection = (level: 'h1' | 'h2' | 'h3', title: string) => {
    const heading = formatting.headings[level]
    
    return (
      <div key={level} className="heading-section">
        <h3 className="tab-section-title">{title}</h3>
        
        <div className="form-row form-row--triple">
          <div className="form-field">
            <label className="form-label">Размер (пт)</label>
            <Input
              type="number"
              value={heading.fontSize}
              onChange={(e) => handleHeadingChange(level, 'fontSize', parseInt(e.target.value) || 14)}
              min={10}
              max={24}
            />
          </div>
          
          <div className="form-field">
            <label className="form-label">Отступ сверху (пт)</label>
            <Input
              type="number"
              value={heading.spaceBefore}
              onChange={(e) => handleHeadingChange(level, 'spaceBefore', parseInt(e.target.value) || 12)}
              min={0}
              max={24}
            />
          </div>
          
          <div className="form-field">
            <label className="form-label">Отступ снизу (пт)</label>
            <Input
              type="number"
              value={heading.spaceAfter}
              onChange={(e) => handleHeadingChange(level, 'spaceAfter', parseInt(e.target.value) || 12)}
              min={0}
              max={24}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Выравнивание</label>
            <select
              className="form-select"
              value={heading.alignment}
              onChange={(e) => handleHeadingChange(level, 'alignment', e.target.value)}
            >
              <option value="center">По центру</option>
              <option value="left">По левому краю</option>
            </select>
          </div>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={heading.bold}
              onChange={(e) => handleHeadingChange(level, 'bold', e.target.checked)}
            />
            <span>Жирный</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={heading.uppercase}
              onChange={(e) => handleHeadingChange(level, 'uppercase', e.target.checked)}
            />
            <span>Заглавные буквы</span>
          </label>
        </div>
      </div>
    )
  }

  return (
    <div className="formatting-tab">
      {renderHeadingSection('h1', '📑 Заголовок 1 уровня (Главы)')}
      {renderHeadingSection('h2', '📄 Заголовок 2 уровня (Разделы)')}
      {renderHeadingSection('h3', '📝 Заголовок 3 уровня (Подразделы)')}

      <div className="info-block">
        <p className="info-block__title">📋 Требования ГОСТ 7.32-2017</p>
        <ul className="info-block__list">
          <li>Заголовки разделов печатаются с прописной буквы без точки в конце</li>
          <li>Заголовки подразделов печатаются с абзацного отступа</li>
          <li>Переносы слов в заголовках не допускаются</li>
        </ul>
      </div>

      <style>{tabStyles}</style>
    </div>
  )
}

const tabStyles = `
.formatting-tab {
  max-width: 800px;
  margin: 0 auto;
}

.heading-section {
  margin-bottom: var(--spacing-40);
  padding-bottom: var(--spacing-32);
  border-bottom: 1px solid var(--color-border-light);
}

.heading-section:last-of-type {
  border-bottom: none;
}

.tab-section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-neutral-100);
  margin: 0 0 var(--spacing-20) 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-20);
  margin-bottom: var(--spacing-20);
}

.form-row--triple {
  grid-template-columns: repeat(3, 1fr);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-neutral-90);
}

.form-select {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border-base);
  background: white;
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
  transition: all 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: var(--color-accent-base);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.checkbox-group {
  display: flex;
  gap: var(--spacing-16);
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-8);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: var(--spacing-12) var(--spacing-16);
  background: var(--color-background-secondary);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.checkbox-label:hover {
  background: var(--color-accent-light);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.info-block {
  margin-top: var(--spacing-32);
  padding: var(--spacing-20);
  background: var(--color-background-secondary);
  border-left: 4px solid var(--color-accent-base);
  border-radius: var(--radius-lg);
}

.info-block__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-neutral-100);
  margin: 0 0 var(--spacing-12) 0;
}

.info-block__list {
  margin: 0;
  padding-left: var(--spacing-20);
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.info-block__list li {
  margin-bottom: var(--spacing-8);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-row--triple {
    grid-template-columns: 1fr;
  }
}
`

export default HeadingsFormattingTab

