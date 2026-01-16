import { Input } from '@/ui'
import type { FormattingSettings } from '@/features/create-generation/types'
import { sharedTabStyles } from './shared-tab-styles'

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

      <style>{sharedTabStyles}</style>
    </div>
  )
}


export default HeadingsFormattingTab

