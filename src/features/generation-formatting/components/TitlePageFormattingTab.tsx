import { Input } from '@/ui'
import type { FormattingSettings } from '@/features/create-generation/types'

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
          
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Выравнивание</label>
              <select
                className="form-select"
                value={formatting.titlePageAlignment}
                onChange={(e) => handleChange('titlePageAlignment', e.target.value as FormattingSettings['titlePageAlignment'])}
              >
                <option value="center">По центру</option>
                <option value="left">По левому краю</option>
              </select>
            </div>
            
            <div className="form-field">
              <label className="form-label">Размер шрифта (пт)</label>
              <Input
                type="number"
                value={formatting.titlePageFontSize}
                onChange={(e) => handleChange('titlePageFontSize', parseInt(e.target.value) || 14)}
                min={10}
                max={18}
              />
            </div>
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-20);
  margin-bottom: var(--spacing-20);
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: var(--spacing-16);
  background: var(--color-background-secondary);
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.checkbox-label:hover {
  background: var(--color-accent-light);
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
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
}
`

export default TitlePageFormattingTab

