/**
 * GenerationTitlePageStep
 * Шаг заполнения данных для титульного листа
 * Появляется перед запуском генерации для текстовых работ
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Input } from '@/ui'
import { useState, useEffect } from 'react'

export interface TitlePageData {
  // Учебное заведение
  universityName: string
  facultyName: string
  departmentName: string
  
  // Работа
  workType: string  // "Курсовая работа", "Реферат", "Дипломная работа"
  discipline: string
  theme: string
  
  // Студент
  studentName: string
  studentGroup: string
  
  // Научный руководитель
  supervisorName: string
  supervisorTitle: string
  
  // Место и год
  city: string
  year: number
}

interface GenerationTitlePageStepProps {
  data: TitlePageData
  workType?: string | null
  onChange: (data: TitlePageData) => void
}

const DEFAULT_TITLE_PAGE_DATA: TitlePageData = {
  universityName: '',
  facultyName: '',
  departmentName: '',
  workType: 'Курсовая работа',
  discipline: '',
  theme: '',
  studentName: '',
  studentGroup: '',
  supervisorName: '',
  supervisorTitle: '',
  city: '',
  year: new Date().getFullYear()
}

function GenerationTitlePageStep({ data, workType, onChange }: GenerationTitlePageStepProps) {
  const [localData, setLocalData] = useState<TitlePageData>(data || DEFAULT_TITLE_PAGE_DATA)

  // Обновить тип работы при изменении
  useEffect(() => {
    if (workType && workType !== localData.workType) {
      const newData = { ...localData, workType: getWorkTypeName(workType) }
      setLocalData(newData)
      onChange(newData)
    }
  }, [workType])

  const getWorkTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'essay': 'Эссе',
      'referat': 'Реферат',
      'doklad': 'Доклад',
      'kursovaya': 'Курсовая работа',
      'vkr': 'Выпускная квалификационная работа',
      'diploma': 'Дипломная работа',
      'article': 'Научная статья'
    }
    return typeMap[type] || 'Курсовая работа'
  }

  const handleChange = (field: keyof TitlePageData, value: string | number) => {
    const newData = { ...localData, [field]: value }
    setLocalData(newData)
    onChange(newData)
  }

  // Inject styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'title-page-step-styles'
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
      <div className="title-page-container">
        <div className="title-page-header">
          <h2 className="title-page-header__title">Добавим титульник?</h2>
          <p className="title-page-header__subtitle">
            Внимательно заполни поля, чтобы создать идеальный титульник
          </p>
        </div>

        <div className="title-page-form">
          {/* Учебное заведение */}
          <div className="form-section">
            <h3 className="form-section__title">Учебное заведение</h3>
            
            <div className="form-field">
              <label className="form-label">Название университета</label>
              <textarea
                className="form-textarea"
                value={localData.universityName}
                onChange={(e) => handleChange('universityName', e.target.value)}
                rows={4}
                placeholder="МИНОБРНАУКИ РОССИИ..."
              />
              <span className="form-hint">Полное название с заглавными буквами</span>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Факультет</label>
                <Input
                  value={localData.facultyName}
                  onChange={(e) => handleChange('facultyName', e.target.value)}
                  placeholder="Факультет математики и информатики"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Кафедра</label>
                <Input
                  value={localData.departmentName}
                  onChange={(e) => handleChange('departmentName', e.target.value)}
                  placeholder="Кафедра прикладной математики"
                />
              </div>
            </div>
          </div>

          {/* Работа */}
          <div className="form-section">
            <h3 className="form-section__title">О работе</h3>
            
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Тип работы</label>
                <select
                  className="form-select"
                  value={localData.workType}
                  onChange={(e) => handleChange('workType', e.target.value)}
                >
                  <option value="Реферат">Реферат</option>
                  <option value="Курсовая работа">Курсовая работа</option>
                  <option value="Дипломная работа">Дипломная работа</option>
                  <option value="Выпускная квалификационная работа">ВКР</option>
                  <option value="Эссе">Эссе</option>
                  <option value="Доклад">Доклад</option>
                  <option value="Научная статья">Научная статья</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Дисциплина</label>
                <Input
                  value={localData.discipline}
                  onChange={(e) => handleChange('discipline', e.target.value)}
                  placeholder="Информатика"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Тема работы</label>
              <Input
                value={localData.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                placeholder="Будет взята из предыдущего шага"
              />
              <span className="form-hint">Можете изменить или оставить как есть</span>
            </div>
          </div>

          {/* Студент */}
          <div className="form-section">
            <h3 className="form-section__title">Студент</h3>
            
            <div className="form-row">
              <div className="form-field form-field--wide">
                <label className="form-label">ФИО студента</label>
                <Input
                  value={localData.studentName}
                  onChange={(e) => handleChange('studentName', e.target.value)}
                  placeholder="Иванов И.И."
                />
              </div>
              <div className="form-field">
                <label className="form-label">Группа</label>
                <Input
                  value={localData.studentGroup}
                  onChange={(e) => handleChange('studentGroup', e.target.value)}
                  placeholder="2ам23"
                />
              </div>
            </div>
          </div>

          {/* Научный руководитель */}
          <div className="form-section">
            <h3 className="form-section__title">Научный руководитель</h3>
            
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Должность и степень</label>
                <Input
                  value={localData.supervisorTitle}
                  onChange={(e) => handleChange('supervisorTitle', e.target.value)}
                  placeholder="канд. пед. наук, доцент"
                />
              </div>
              <div className="form-field">
                <label className="form-label">ФИО</label>
                <Input
                  value={localData.supervisorName}
                  onChange={(e) => handleChange('supervisorName', e.target.value)}
                  placeholder="Петров П.П."
                />
              </div>
            </div>
          </div>

          {/* Место и год */}
          <div className="form-section">
            <h3 className="form-section__title">Место и год</h3>
            
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Город</label>
                <Input
                  value={localData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="г. Москва"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Год</label>
                <Input
                  type="number"
                  value={localData.year}
                  onChange={(e) => handleChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                  placeholder={new Date().getFullYear().toString()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const stepStyles = `
.title-page-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.title-page-header {
  text-align: center;
  margin-bottom: var(--spacing-48);
}

.title-page-header__title {
  font-size: 32px;
  font-weight: 800;
  color: var(--color-neutral-110);
  margin: 0 0 var(--spacing-12) 0;
  letter-spacing: -0.02em;
}

.title-page-header__subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.title-page-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-40);
}

.form-section {
  background: white;
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-xl);
  padding: var(--spacing-32);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.form-section__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-neutral-100);
  margin: 0 0 var(--spacing-24) 0;
  padding-bottom: var(--spacing-16);
  border-bottom: 2px solid var(--color-border-light);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-24);
  margin-bottom: var(--spacing-24);
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
}

.form-field--wide {
  grid-column: span 1;
}

.form-field:only-child {
  grid-column: span 2;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-neutral-90);
}

.form-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border-base);
  background: white;
  font-size: 14px;
  font-family: inherit;
  color: var(--color-text-primary);
  resize: vertical;
  transition: all 0.2s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-accent-base);
  box-shadow: 0 0 0 3px var(--color-accent-light);
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
  
  .form-field--wide {
    grid-column: span 1;
  }
  
  .title-page-header__title {
    font-size: 24px;
  }
  
  .form-section {
    padding: var(--spacing-20);
  }
}
`

export default GenerationTitlePageStep
export { DEFAULT_TITLE_PAGE_DATA }

