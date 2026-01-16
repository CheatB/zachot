import { Input } from '@/ui'
import type { FormattingSettings } from '@/features/create-generation/types'
import { sharedTabStyles } from './shared-tab-styles'

interface ContentFormattingTabProps {
  formatting: FormattingSettings
  onChange: (formatting: FormattingSettings) => void
}

function ContentFormattingTab({ formatting, onChange }: ContentFormattingTabProps) {
  const handleChange = <K extends keyof FormattingSettings>(
    field: K,
    value: FormattingSettings[K]
  ) => {
    onChange({ ...formatting, [field]: value })
  }

  const handleIntroductionChange = (field: keyof FormattingSettings['introductionElements'], value: boolean) => {
    onChange({
      ...formatting,
      introductionElements: {
        ...formatting.introductionElements,
        [field]: value,
      },
    })
  }

  const handleConclusionChange = (field: keyof FormattingSettings['conclusionElements'], value: boolean) => {
    onChange({
      ...formatting,
      conclusionElements: {
        ...formatting.conclusionElements,
        [field]: value,
      },
    })
  }

  const handlePageNumberingChange = <K extends keyof FormattingSettings>(
    field: K,
    value: FormattingSettings[K]
  ) => {
    onChange({ ...formatting, [field]: value })
  }

  return (
    <div className="formatting-tab">
      <h3 className="tab-section-title">Содержание (оглавление)</h3>
      
      <div className="form-field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formatting.hasTableOfContents}
            onChange={(e) => handleChange('hasTableOfContents', e.target.checked)}
          />
          <span>Включить содержание</span>
        </label>
      </div>

      {formatting.hasTableOfContents && (
        <>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Размер шрифта (пт)</label>
              <Input
                type="number"
                value={formatting.tocFontSize}
                onChange={(e) => handleChange('tocFontSize', parseInt(e.target.value) || 14)}
                min={10}
                max={16}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formatting.tocShowPageNumbers}
                onChange={(e) => handleChange('tocShowPageNumbers', e.target.checked)}
              />
              <span>Показывать номера страниц</span>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formatting.tocDotLeader}
                onChange={(e) => handleChange('tocDotLeader', e.target.checked)}
              />
              <span>Точки-разделители</span>
            </label>
          </div>
        </>
      )}

      <h3 className="tab-section-title">Нумерация страниц</h3>
      
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Расположение номера</label>
          <select
            className="form-select"
            value={formatting.pageNumbering}
            onChange={(e) => handlePageNumberingChange('pageNumbering', e.target.value as FormattingSettings['pageNumbering'])}
          >
            <option value="bottom-center">Внизу по центру</option>
            <option value="bottom-right">Внизу справа</option>
            <option value="top-right">Вверху справа</option>
            <option value="none">Без нумерации</option>
          </select>
        </div>
        
        <div className="form-field">
          <label className="form-label">Начать с страницы</label>
          <Input
            type="number"
            value={formatting.pageNumberingStartFrom}
            onChange={(e) => handlePageNumberingChange('pageNumberingStartFrom', parseInt(e.target.value) || 3)}
            min={1}
            max={10}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Размер шрифта номера (пт)</label>
        <Input
          type="number"
          value={formatting.pageNumberingFontSize}
          onChange={(e) => handlePageNumberingChange('pageNumberingFontSize', parseInt(e.target.value) || 12)}
          min={10}
          max={14}
        />
      </div>

      <h3 className="tab-section-title">Введение (обязательные элементы)</h3>
      
      <div className="checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formatting.introductionElements.hasActuality}
            onChange={(e) => handleIntroductionChange('hasActuality', e.target.checked)}
          />
          <span>Актуальность</span>
        </label>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formatting.introductionElements.hasGoal}
            onChange={(e) => handleIntroductionChange('hasGoal', e.target.checked)}
          />
          <span>Цель работы</span>
        </label>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formatting.introductionElements.hasTasks}
            onChange={(e) => handleIntroductionChange('hasTasks', e.target.checked)}
          />
          <span>Задачи</span>
        </label>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formatting.introductionElements.hasMethodology}
            onChange={(e) => handleIntroductionChange('hasMethodology', e.target.checked)}
          />
          <span>Методология</span>
        </label>
      </div>

      <h3 className="tab-section-title">Заключение (обязательные элементы)</h3>
      
      <div className="checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formatting.conclusionElements.hasResults}
            onChange={(e) => handleConclusionChange('hasResults', e.target.checked)}
          />
          <span>Результаты</span>
        </label>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formatting.conclusionElements.hasConclusions}
            onChange={(e) => handleConclusionChange('hasConclusions', e.target.checked)}
          />
          <span>Выводы</span>
        </label>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formatting.conclusionElements.hasRecommendations}
            onChange={(e) => handleConclusionChange('hasRecommendations', e.target.checked)}
          />
          <span>Рекомендации</span>
        </label>
      </div>

      <div className="info-block">
        <p className="info-block__title">📋 Требования ГОСТ 7.32-2017</p>
        <ul className="info-block__list">
          <li>Содержание включает все разделы с указанием страниц</li>
          <li>Нумерация страниц начинается с титульного листа, но номер на нем не ставится</li>
          <li>Введение должно содержать обоснование актуальности, цель и задачи</li>
          <li>Заключение содержит краткие выводы по результатам работы</li>
        </ul>
      </div>

      <style>{sharedTabStyles}</style>
    </div>
  )
}


export default ContentFormattingTab

