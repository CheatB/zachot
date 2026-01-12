/**
 * GenerationFormattingStep
 * Шаг 5.5: Настройка оформления (ГОСТ)
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Button, Stack, Input, Tooltip } from '@/ui'
import type { FormattingSettings } from './types'
import { DEFAULT_GOST_FORMATTING } from './types'
import { useState } from 'react'

interface GenerationFormattingStepProps {
  formatting: FormattingSettings
  onChange: (formatting: FormattingSettings) => void
}

function GenerationFormattingStep({ formatting, onChange }: GenerationFormattingStepProps) {
  const [localFormatting, setLocalFormatting] = useState<FormattingSettings>(formatting || DEFAULT_GOST_FORMATTING)

  const handleChange = (key: keyof FormattingSettings, value: any) => {
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
      <div className="wizard-step">
        <Stack gap="xl">
          <Card variant="default" style={{ padding: 'var(--spacing-24)', backgroundColor: 'var(--color-accent-light)', border: '1px dashed var(--color-accent-base)' }}>
            <Stack gap="sm">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--color-accent-dark)' }}>
                  🎓 Стандарт оформления: ГОСТ 2026
                </h3>
                <Button variant="ghost" size="sm" onClick={resetToGoST} style={{ color: 'var(--color-accent-dark)' }}>
                  Сбросить до ГОСТ
                </Button>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                По умолчанию установлены параметры, соответствующие требованиям большинства университетов РФ: 
                Шрифт 14pt, интервал 1.5, выравнивание по ширине и стандартные поля.
              </p>
            </Stack>
          </Card>

          <div className="formatting-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {/* Текст и шрифт */}
            <Card style={{ padding: '20px' }}>
              <Stack gap="md">
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Шрифт и текст</h4>
                
                <Stack gap="xs">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>Шрифт:</span>
                    <Tooltip content="Гарнитура основного текста. По ГОСТу обычно используется Times New Roman.">
                      <span style={{ cursor: 'help' }}>ℹ️</span>
                    </Tooltip>
                  </div>
                  <select 
                    value={localFormatting.fontFamily} 
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border-base)' }}
                  >
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Calibri">Calibri</option>
                  </select>
                </Stack>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>Размер:</span>
                      <Tooltip content="Кегль основного текста. Стандарт — 14pt.">
                        <span style={{ cursor: 'help' }}>ℹ️</span>
                      </Tooltip>
                    </div>
                    <Input 
                      type="number" 
                      value={localFormatting.fontSize} 
                      onChange={(e) => handleChange('fontSize', Number(e.target.value))} 
                    />
                  </Stack>
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>Интервал:</span>
                      <Tooltip content="Межстрочный интервал. По ГОСТу — 1.5.">
                        <span style={{ cursor: 'help' }}>ℹ️</span>
                      </Tooltip>
                    </div>
                    <Input 
                      type="number" 
                      step="0.1" 
                      value={localFormatting.lineSpacing} 
                      onChange={(e) => handleChange('lineSpacing', Number(e.target.value))} 
                    />
                  </Stack>
                </div>
              </Stack>
            </Card>

            {/* Поля */}
            <Card style={{ padding: '20px' }}>
              <Stack gap="md">
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Поля (мм)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Stack gap="xs">
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Верхнее:</span>
                    <Input type="number" value={localFormatting.margins.top} onChange={(e) => handleMarginChange('top', Number(e.target.value))} />
                  </Stack>
                  <Stack gap="xs">
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Нижнее:</span>
                    <Input type="number" value={localFormatting.margins.bottom} onChange={(e) => handleMarginChange('bottom', Number(e.target.value))} />
                  </Stack>
                  <Stack gap="xs">
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Левое:</span>
                    <Input type="number" value={localFormatting.margins.left} onChange={(e) => handleMarginChange('left', Number(e.target.value))} />
                  </Stack>
                  <Stack gap="xs">
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Правое:</span>
                    <Input type="number" value={localFormatting.margins.right} onChange={(e) => handleMarginChange('right', Number(e.target.value))} />
                  </Stack>
                </div>
              </Stack>
            </Card>

            {/* Дополнительно */}
            <Card style={{ padding: '20px' }}>
              <Stack gap="md">
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Структура и нумерация</h4>
                
                <Stack gap="xs">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>Нумерация страниц:</span>
                    <Tooltip content="Расположение номера страницы. По ГОСТу — обычно снизу по центру.">
                      <span style={{ cursor: 'help' }}>ℹ️</span>
                    </Tooltip>
                  </div>
                  <select 
                    value={localFormatting.pageNumbering} 
                    onChange={(e) => handleChange('pageNumbering', e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border-base)' }}
                  >
                    <option value="bottom-center">Снизу по центру</option>
                    <option value="bottom-right">Снизу справа</option>
                    <option value="top-right">Сверху справа</option>
                    <option value="none">Нет</option>
                  </select>
                </Stack>

                <Stack gap="sm">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={localFormatting.hasTitlePage} 
                      onChange={(e) => handleChange('hasTitlePage', e.target.checked)} 
                    />
                    <span style={{ fontSize: '14px' }}>Титульный лист</span>
                    <Tooltip content="Создать первую страницу с реквизитами работы.">
                      <span style={{ cursor: 'help' }}>ℹ️</span>
                    </Tooltip>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={localFormatting.hasTableOfContents} 
                      onChange={(e) => handleChange('hasTableOfContents', e.target.checked)} 
                    />
                    <span style={{ fontSize: '14px' }}>Содержание</span>
                    <Tooltip content="Сгенерировать автоматическое оглавление.">
                      <span style={{ cursor: 'help' }}>ℹ️</span>
                    </Tooltip>
                  </label>
                </Stack>
              </Stack>
            </Card>
          </div>

          <Card variant="default" style={{ padding: '20px', backgroundColor: 'var(--color-neutral-10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '24px' }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>AI-оформитель активен</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Для контроля оформления используется модель **GPT-4o-mini**. Она проверит текст на соответствие заданным параметрам перед выдачей результата.
                </div>
              </div>
            </div>
          </Card>
        </Stack>
      </div>
    </motion.div>
  )
}

export default GenerationFormattingStep

