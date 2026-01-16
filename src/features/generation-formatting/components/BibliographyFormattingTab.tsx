import { Input } from '@/ui'
import type { FormattingSettings } from '@/features/create-generation/types'
import { sharedTabStyles } from './shared-tab-styles'

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

      <style>{sharedTabStyles}</style>
    </div>
  )
}


export default BibliographyFormattingTab

