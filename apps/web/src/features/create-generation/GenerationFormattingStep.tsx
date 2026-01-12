/**
 * GenerationFormattingStep
 * Шаг 5.5: Настройка оформления (ГОСТ)
 * Redesigned to have all fields in a single unified area without individual cards.
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Button, Input, Tooltip } from '@/ui'
import type { FormattingSettings } from './types'
import { DEFAULT_GOST_FORMATTING } from './types'
import { useState, useEffect } from 'react'

interface GenerationFormattingStepProps {
  formatting: FormattingSettings
  onChange: (formatting: FormattingSettings) => void
}

function GenerationFormattingStep({ formatting, onChange }: GenerationFormattingStepProps) {
  const [localFormatting, setLocalFormatting] = useState<FormattingSettings>(formatting || DEFAULT_GOST_FORMATTING)

  const handleChange = <K extends keyof FormattingSettings>(key: K, value: FormattingSettings[K]) => {
    const updated = { ...localFormatting, [key]: value }
    setLocalFormatting(updated)
    onChange(updated)
  }

  const handleMarginChange = (side: keyof FormattingSettings['margins'], value: number) => {
    const updated = { 
      ...localFormatting, 
      margins: { ...localFormatting.margins, [side]: value } 
    }
    setLocalFormatting(updated)
    onChange(updated)
  }

  const resetToGoST = () => {
    setLocalFormatting(DEFAULT_GOST_FORMATTING)
    onChange(DEFAULT_GOST_FORMATTING)
  }

  // Inject styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'formatting-step-styles-v2'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = stepStyles
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: motionTokens.duration.slow,
        ease: motionTokens.easing.out,
      }}
    >
      <div className="formatting-container-v2">
        {/* Banner / Info */}
        <div className="formatting-info-area">
          <div className="info-text">
            <h3 className="info-text__title">🎓 Параметры ГОСТ 2026</h3>
            <p className="info-text__desc">Настройте оформление вашей работы. Мы автоматически применим эти правила при генерации финального документа.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={resetToGoST}>Сбросить настройки</Button>
        </div>

        {/* Unified Form Area */}
        <div className="formatting-form-box">
          <div className="form-section">
            <h4 className="form-section__header">Шрифт и текст</h4>
            <div className="form-row">
              <div className="form-field flex-2">
                <div className="label-with-tool">
                  <label>Шрифт</label>
                  <Tooltip content="Основной шрифт документа. По стандарту используется Times New Roman.">
                    <button className="info-trigger" type="button">?</button>
                  </Tooltip>
                </div>
                <select 
                  className="form-input-select"
                  value={localFormatting.fontFamily} 
                  onChange={(e) => handleChange('fontFamily', e.target.value as any)}
                >
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Arial">Arial</option>
                  <option value="Calibri">Calibri</option>
                </select>
              </div>
              <div className="form-field">
                <div className="label-with-tool">
                  <label>Размер (pt)</label>
                  <Tooltip content="Кегль шрифта. Стандарт для вузов — 14 пунктов.">
                    <button className="info-trigger" type="button">?</button>
                  </Tooltip>
                </div>
                <Input type="number" value={localFormatting.fontSize} onChange={(e) => handleChange('fontSize', Number(e.target.value))} />
              </div>
              <div className="form-field">
                <div className="label-with-tool">
                  <label>Интервал</label>
                  <Tooltip content="Межстрочный интервал. Рекомендуемое значение — 1.5.">
                    <button className="info-trigger" type="button">?</button>
                  </Tooltip>
                </div>
                <Input type="number" step="0.1" value={localFormatting.lineSpacing} onChange={(e) => handleChange('lineSpacing', Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-section">
            <h4 className="form-section__header">Поля страницы (мм)</h4>
            <div className="form-row form-row--grid">
              <div className="form-field">
                <label className="label-lite">Верхнее</label>
                <Input type="number" value={localFormatting.margins.top} onChange={(e) => handleMarginChange('top', Number(e.target.value))} />
              </div>
              <div className="form-field">
                <label className="label-lite">Нижнее</label>
                <Input type="number" value={localFormatting.margins.bottom} onChange={(e) => handleMarginChange('bottom', Number(e.target.value))} />
              </div>
              <div className="form-field">
                <label className="label-lite">Левое</label>
                <Input type="number" value={localFormatting.margins.left} onChange={(e) => handleMarginChange('left', Number(e.target.value))} />
              </div>
              <div className="form-field">
                <label className="label-lite">Правое</label>
                <Input type="number" value={localFormatting.margins.right} onChange={(e) => handleMarginChange('right', Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-section">
            <h4 className="form-section__header">Нумерация и структура</h4>
            <div className="form-row">
              <div className="form-field flex-2">
                <div className="label-with-tool">
                  <label>Расположение номера</label>
                  <Tooltip content="Где будет отображаться номер страницы. Стандарт — снизу по центру.">
                    <button className="info-trigger" type="button">?</button>
                  </Tooltip>
                </div>
                <select 
                  className="form-input-select"
                  value={localFormatting.pageNumbering} 
                  onChange={(e) => handleChange('pageNumbering', e.target.value as any)}
                >
                  <option value="bottom-center">Снизу по центру</option>
                  <option value="bottom-right">Снизу справа</option>
                  <option value="top-right">Сверху справа</option>
                  <option value="none">Без нумерации</option>
                </select>
              </div>
              <div className="form-field flex-row-items">
                <label className="check-label">
                  <input type="checkbox" checked={localFormatting.hasTitlePage} onChange={(e) => handleChange('hasTitlePage', e.target.checked)} />
                  <span>Титульный лист</span>
                </label>
                <label className="check-label">
                  <input type="checkbox" checked={localFormatting.hasTableOfContents} onChange={(e) => handleChange('hasTableOfContents', e.target.checked)} />
                  <span>Содержание</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* AI Agent Banner */}
        <div className="ai-formatting-banner">
          <div className="ai-branding">
            <span className="ai-tag">🤖 AI-Оформитель</span>
            <span className="ai-model">GPT-4o-mini</span>
          </div>
          <p className="ai-text">Система автоматически проверит соответствие текста всем заданным параметрам и исправит ошибки форматирования.</p>
        </div>
      </div>
    </motion.div>
  )
}

const stepStyles = `
.formatting-container-v2 {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.formatting-info-area {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-32);
}

.info-text__title {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-neutral-110);
  margin: 0 0 8px 0;
}

.info-text__desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.formatting-form-box {
  background: white;
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-xl);
  padding: var(--spacing-32);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-20);
}

.form-section__header {
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 0;
}

.form-row {
  display: flex;
  gap: var(--spacing-24);
  flex-wrap: wrap;
}

.form-row--grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-16);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
  min-width: 120px;
}

.flex-2 {
  flex: 2;
  min-width: 200px;
}

.flex-row-items {
  flex-direction: row;
  align-items: flex-end;
  gap: var(--spacing-24);
  padding-bottom: 12px;
}

.label-with-tool {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-with-tool label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-neutral-90);
}

.info-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-neutral-10);
  border: 1px solid var(--color-border-base);
  font-size: 10px;
  color: var(--color-text-muted);
  cursor: help;
  padding: 0;
}

.label-lite {
  font-size: 12px;
  color: var(--color-text-muted);
}

.form-input-select {
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
}

.check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.check-label input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-accent-base);
}

.form-divider {
  height: 1px;
  background-color: var(--color-border-light);
  margin: var(--spacing-24) 0;
}

.ai-formatting-banner {
  margin-top: var(--spacing-32);
  background-color: var(--color-neutral-5);
  border-radius: var(--radius-lg);
  padding: var(--spacing-20);
}

.ai-branding {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ai-tag {
  font-weight: 800;
  font-size: 12px;
  color: var(--color-neutral-100);
}

.ai-model {
  font-size: 10px;
  color: var(--color-text-muted);
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--color-border-light);
}

.ai-text {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 600px) {
  .form-row--grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .formatting-form-box {
    padding: var(--spacing-20);
  }
}
`

export default GenerationFormattingStep
