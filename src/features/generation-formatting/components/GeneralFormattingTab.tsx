/**
 * GeneralFormattingTab
 * Вкладка основных параметров форматирования
 */

import { Input } from '@/ui'
import type { FormattingSettings } from '@/features/create-generation/types'
import { sharedTabStyles } from './shared-tab-styles'

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
            className="form-input"
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
            className="form-input"
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
            className="form-input"
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
            className="form-input"
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
            className="form-input"
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
            className="form-input"
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
            className="form-input"
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

      <style>{sharedTabStyles}</style>
    </div>
  )
}

export default GeneralFormattingTab

