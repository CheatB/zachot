import { Input } from '@/ui'
import type { FormattingSettings } from '@/features/create-generation/types'

interface BibliographyFormattingTabProps {
  formatting: FormattingSettings
  onChange: (formatting: FormattingSettings) => void
}

function BibliographyFormattingTab({ formatting, onChange }: BibliographyFormattingTabProps) {
  const handleChange = <K extends keyof FormattingSettings>(
    field: K,
    value: FormattingSettings[K]
  ) => {
    onChange({ ...formatting, [field]: value })
  }

  return (
    <div className="formatting-tab">
      <h3 className="tab-section-title">Стиль оформления</h3>
      
      <div className="form-field">
        <label className="form-label">Стиль библиографии</label>
        <select
          className="form-select"
          value={formatting.bibliographyStyle}
          onChange={(e) => handleChange('bibliographyStyle', e.target.value as FormattingSettings['bibliographyStyle'])}
        >
          <option value="gost">ГОСТ Р 7.0.5-2008</option>
          <option value="apa">APA (American Psychological Association)</option>
          <option value="mla">MLA (Modern Language Association)</option>
        </select>
      </div>

      <h3 className="tab-section-title">Параметры форматирования</h3>
      
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Размер шрифта (пт)</label>
          <Input
            type="number"
            value={formatting.bibliographyFontSize}
            onChange={(e) => handleChange('bibliographyFontSize', parseInt(e.target.value) || 14)}
            min={10}
            max={16}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label">Межстрочный интервал</label>
          <Input
            type="number"
            step="0.1"
            value={formatting.bibliographySpacing}
            onChange={(e) => handleChange('bibliographySpacing', parseFloat(e.target.value) || 1)}
            min={1}
            max={2}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formatting.bibliographyHanging}
            onChange={(e) => handleChange('bibliographyHanging', e.target.checked)}
          />
          <span>Висячий отступ (первая строка выступает)</span>
        </label>
      </div>

      <div className="info-block">
        <p className="info-block__title">📚 Требования ГОСТ Р 7.0.5-2008</p>
        <ul className="info-block__list">
          <li>Источники располагаются в алфавитном порядке</li>
          <li>Нумерация сквозная арабскими цифрами</li>
          <li>Обязательные элементы: автор, название, место издания, издательство, год, количество страниц</li>
          <li>Для электронных ресурсов указывается URL и дата обращения</li>
        </ul>
      </div>

      <div className="example-block">
        <p className="example-block__title">Пример оформления по ГОСТ:</p>
        <div className="example-block__content">
          <p>1. Иванов, И. И. Основы программирования / И. И. Иванов. — М. : Наука, 2020. — 350 с.</p>
          <p>2. Петров, П. П. Искусственный интеллект [Электронный ресурс] / П. П. Петров. — Режим доступа: https://example.com/article (дата обращения: 15.01.2026).</p>
        </div>
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

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
  margin-bottom: var(--spacing-16);
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
  font-size: 14px;
  font-weight: 500;
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

.example-block {
  margin-top: var(--spacing-24);
  padding: var(--spacing-20);
  background: var(--color-neutral-10);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-base);
}

.example-block__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-neutral-100);
  margin: 0 0 var(--spacing-12) 0;
}

.example-block__content {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.example-block__content p {
  margin: 0 0 var(--spacing-12) 0;
  padding-left: var(--spacing-16);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
`

export default BibliographyFormattingTab

