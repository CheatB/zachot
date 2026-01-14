/**
 * GeneralFormattingTab
 * Вкладка основных параметров форматирования
 */

import { Input } from '@/ui'
import type { FormattingSettings } from '@/features/create-generation/types'

interface GeneralFormattingTabProps {
  formatting: FormattingSettings
  onChange: (formatting: FormattingSettings) => void
}

function GeneralFormattingTab({ formatting, onChange }: GeneralFormattingTabProps) {
  const handleChange = <K extends keyof FormattingSettings>(
    field: K,
    value: FormattingSettings[K]
  ) => {
    onChange({ ...formatting, [field]: value })
  }

  const handleMarginChange = (side: keyof FormattingSettings['margins'], value: number) => {
    onChange({
      ...formatting,
      margins: { ...formatting.margins, [side]: value },
    })
  }

  return (
    <div className="formatting-tab">
      <h3 className="tab-section-title">Шрифт и размер</h3>
      
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Шрифт</label>
          <select
            className="form-select"
            value={formatting.fontFamily}
            onChange={(e) => handleChange('fontFamily', e.target.value as FormattingSettings['fontFamily'])}
          >
            <option value="Times New Roman">Times New Roman</option>
            <option value="Arial">Arial</option>
            <option value="Calibri">Calibri</option>
          </select>
        </div>
        
        <div className="form-field">
          <label className="form-label">Размер шрифта (пт)</label>
          <Input
            type="number"
            value={formatting.fontSize}
            onChange={(e) => handleChange('fontSize', parseInt(e.target.value) || 14)}
            min={10}
            max={18}
          />
        </div>
      </div>

      <h3 className="tab-section-title">Отступы и интервалы</h3>
      
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Межстрочный интервал</label>
          <Input
            type="number"
            step="0.1"
            value={formatting.lineSpacing}
            onChange={(e) => handleChange('lineSpacing', parseFloat(e.target.value) || 1.5)}
            min={1}
            max={3}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Абзацный отступ (см)</label>
          <Input
            type="number"
            step="0.25"
            value={formatting.paragraphIndent}
            onChange={(e) => handleChange('paragraphIndent', parseFloat(e.target.value) || 1.25)}
            min={0}
            max={3}
          />
        </div>
      </div>

      <h3 className="tab-section-title">Поля страницы (мм)</h3>
      
      <div className="form-row form-row--quad">
        <div className="form-field">
          <label className="form-label">Верхнее</label>
          <Input
            type="number"
            value={formatting.margins.top}
            onChange={(e) => handleMarginChange('top', parseInt(e.target.value) || 20)}
            min={10}
            max={50}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Нижнее</label>
          <Input
            type="number"
            value={formatting.margins.bottom}
            onChange={(e) => handleMarginChange('bottom', parseInt(e.target.value) || 20)}
            min={10}
            max={50}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Левое</label>
          <Input
            type="number"
            value={formatting.margins.left}
            onChange={(e) => handleMarginChange('left', parseInt(e.target.value) || 30)}
            min={10}
            max={50}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Правое</label>
          <Input
            type="number"
            value={formatting.margins.right}
            onChange={(e) => handleMarginChange('right', parseInt(e.target.value) || 10)}
            min={10}
            max={50}
          />
        </div>
      </div>

      <h3 className="tab-section-title">Выравнивание</h3>
      
      <div className="form-field">
        <label className="form-label">Выравнивание текста</label>
        <select
          className="form-select"
          value={formatting.alignment}
          onChange={(e) => handleChange('alignment', e.target.value as FormattingSettings['alignment'])}
        >
          <option value="justify">По ширине</option>
          <option value="left">По левому краю</option>
        </select>
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

.tab-section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-neutral-100);
  margin: var(--spacing-32) 0 var(--spacing-16) 0;
  padding-bottom: var(--spacing-12);
  border-bottom: 2px solid var(--color-border-light);
}

.tab-section-title:first-child {
  margin-top: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-20);
  margin-bottom: var(--spacing-20);
}

.form-row--quad {
  grid-template-columns: repeat(4, 1fr);
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-row--quad {
    grid-template-columns: 1fr 1fr;
  }
}
`

export default GeneralFormattingTab

