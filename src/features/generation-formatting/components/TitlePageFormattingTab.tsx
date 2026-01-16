import { Input } from '@/ui'
import type { FormattingSettings } from '@/features/create-generation/types'
import { sharedTabStyles } from './shared-tab-styles'

interface TitlePageFormattingTabProps {
  formatting: FormattingSettings
  onChange: (formatting: FormattingSettings) => void
}

function TitlePageFormattingTab({ formatting, onChange }: TitlePageFormattingTabProps) {
  const handleChange = <K extends keyof FormattingSettings>(
    field: K,
    value: FormattingSettings[K]
  ) => {
    onChange({ ...formatting, [field]: value })
  }

  return (
    <div className="formatting-tab">
      <div className="form-field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formatting.hasTitlePage}
            onChange={(e) => handleChange('hasTitlePage', e.target.checked)}
          />
          <span>Включить титульный лист</span>
        </label>
      </div>

      {formatting.hasTitlePage && (
        <>
          <h3 className="tab-section-title">Параметры титульного листа</h3>
          
          <div className="form-field">
            <label className="form-label">Размер шрифта (пт)</label>
            <Input
              type="number"
              value={formatting.titlePageFontSize}
              onChange={(e) => handleChange('titlePageFontSize', parseInt(e.target.value) || 14)}
              min={10}
              max={18}
              className="form-input"
            />
          </div>

          <div className="info-block">
            <p className="info-block__title">📋 Требования ГОСТ 7.32-2017</p>
            <ul className="info-block__list">
              <li>Титульный лист не нумеруется</li>
              <li>Содержит: название организации, тип работы, тему, ФИО автора и руководителя, город и год</li>
              <li>Все элементы выравниваются по центру или согласно шаблону</li>
            </ul>
          </div>
        </>
      )}

      <style>{sharedTabStyles}</style>
    </div>
  )
}

export default TitlePageFormattingTab

