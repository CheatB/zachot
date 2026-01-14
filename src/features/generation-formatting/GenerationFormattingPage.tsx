/**
 * GenerationFormattingPage
 * Страница настройки форматирования готовой работы по ГОСТ
 * Появляется после генерации текста, перед финальным экспортом
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Container, Stack, Button } from '@/ui'
import { getGenerationById, updateGeneration } from '@/shared/api/generations'
import type { Generation } from '@/shared/api/generations'
import type { FormattingSettings } from '@/features/create-generation/types'
import { DEFAULT_GOST_FORMATTING } from '@/features/create-generation/types'

// Компоненты вкладок
import GeneralFormattingTab from './components/GeneralFormattingTab'
import TitlePageFormattingTab from './components/TitlePageFormattingTab'
import HeadingsFormattingTab from './components/HeadingsFormattingTab'
import BibliographyFormattingTab from './components/BibliographyFormattingTab'
import ContentFormattingTab from './components/ContentFormattingTab'

function GenerationFormattingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [formatting, setFormatting] = useState<FormattingSettings>(DEFAULT_GOST_FORMATTING)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [formattingAttempts, setFormattingAttempts] = useState(0)

  useEffect(() => {
    if (!id) return
    
    getGenerationById(id)
      .then((gen) => {
        setGeneration(gen)
        if (gen.settings_payload?.formatting) {
          setFormatting(gen.settings_payload.formatting)
        }
        // Получить количество попыток форматирования из метаданных
        setFormattingAttempts((gen.input_payload as any)?.formatting_attempts || 0)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load generation:', error)
        setLoading(false)
      })
  }, [id])

  const handleResetToGOST = () => {
    setFormatting(DEFAULT_GOST_FORMATTING)
  }

  const handleApplyFormatting = async () => {
    if (!id || !generation) return
    
    // Проверка лимита форматирований
    if (formattingAttempts >= 2) {
      // TODO: Показать модалку с предложением потратить 1 кредит
      alert('Вы исчерпали бесплатные попытки форматирования. Следующая попытка будет стоить 1 кредит.')
      return
    }
    
    setSaving(true)
    
    try {
      await updateGeneration(id, {
        settings_payload: {
          ...generation.settings_payload,
          formatting,
        },
        input_payload: {
          ...generation.input_payload,
          formatting_attempts: formattingAttempts + 1,
        } as any,
      })
      
      setFormattingAttempts(formattingAttempts + 1)
      
      // Перейти к экспорту
      navigate(`/generations/${id}/result`)
    } catch (error) {
      console.error('Failed to apply formatting:', error)
      alert('Не удалось применить форматирование. Попробуйте снова.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    if (!id) return
    navigate(`/generations/${id}/result`)
  }

  if (loading) {
    return (
      <Container>
        <Stack gap="lg" align="center" style={{ padding: 'var(--spacing-64) 0' }}>
          <p>Загрузка...</p>
        </Stack>
      </Container>
    )
  }

  if (!generation) {
    return (
      <Container>
        <Stack gap="lg" align="center" style={{ padding: 'var(--spacing-64) 0' }}>
          <p>Генерация не найдена</p>
          <Button onClick={() => navigate('/generations')}>Вернуться к списку</Button>
        </Stack>
      </Container>
    )
  }

  const tabs = [
    { id: 'general', label: '📄 Основные' },
    { id: 'titlepage', label: '📋 Титульник' },
    { id: 'headings', label: '📑 Заголовки' },
    { id: 'bibliography', label: '📚 Библиография' },
    { id: 'content', label: '✍️ Содержание' },
  ]

  // Inject styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'formatting-page-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = pageStyles
    }
  }, [])

  return (
    <div className="formatting-page">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Stack gap="xl">
            {/* Header */}
            <div className="formatting-header">
              <h1 className="formatting-header__title">Настройка оформления</h1>
              <p className="formatting-header__subtitle">
                Настройте параметры оформления по ГОСТ 7.32-2017 или выберите свои настройки
              </p>
              <div className="formatting-header__info">
                <span className="formatting-attempts">
                  Бесплатных попыток: <strong>{2 - formattingAttempts}</strong> из 2
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="formatting-actions">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleResetToGOST}
                style={{ flex: 1 }}
              >
                📄 Сбросить на ГОСТ
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={handleSkip}
                style={{ flex: 1 }}
              >
                Пропустить
              </Button>
            </div>

            {/* Tabs */}
            <div className="formatting-tabs">
              <div className="tabs-header">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? 'tab-button--active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="tabs-content">
                {activeTab === 'general' && (
                  <GeneralFormattingTab 
                    formatting={formatting} 
                    onChange={setFormatting} 
                  />
                )}
                {activeTab === 'titlepage' && (
                  <TitlePageFormattingTab 
                    formatting={formatting} 
                    onChange={setFormatting} 
                  />
                )}
                {activeTab === 'headings' && (
                  <HeadingsFormattingTab 
                    formatting={formatting} 
                    onChange={setFormatting} 
                  />
                )}
                {activeTab === 'bibliography' && (
                  <BibliographyFormattingTab 
                    formatting={formatting} 
                    onChange={setFormatting} 
                  />
                )}
                {activeTab === 'content' && (
                  <ContentFormattingTab 
                    formatting={formatting} 
                    onChange={setFormatting} 
                  />
                )}
              </div>
            </div>

            {/* Apply Button */}
            <div className="formatting-footer">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleApplyFormatting}
                disabled={saving}
                style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
              >
                {saving ? 'Применение...' : 'Применить форматирование'}
              </Button>
              <p className="formatting-footer__hint">
                Система автоматически применит все параметры при экспорте документа
              </p>
            </div>
          </Stack>
        </motion.div>
      </Container>
    </div>
  )
}

const pageStyles = `
.formatting-page {
  min-height: 100vh;
  padding: var(--spacing-48) 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.formatting-header {
  text-align: center;
  margin-bottom: var(--spacing-32);
}

.formatting-header__title {
  font-size: 32px;
  font-weight: 800;
  color: var(--color-neutral-110);
  margin: 0 0 var(--spacing-12) 0;
  letter-spacing: -0.02em;
}

.formatting-header__subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-16) 0;
  line-height: 1.5;
}

.formatting-header__info {
  display: flex;
  justify-content: center;
  gap: var(--spacing-16);
  margin-top: var(--spacing-16);
}

.formatting-attempts {
  padding: var(--spacing-8) var(--spacing-16);
  background: var(--color-accent-light);
  border: 1px solid var(--color-accent-base);
  border-radius: var(--radius-lg);
  font-size: 14px;
  color: var(--color-accent-dark);
}

.formatting-actions {
  display: flex;
  gap: var(--spacing-16);
  margin-bottom: var(--spacing-32);
}

.formatting-tabs {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tabs-header {
  display: flex;
  border-bottom: 2px solid var(--color-border-light);
  background: var(--color-background-secondary);
  overflow-x: auto;
}

.tab-button {
  flex: 1;
  min-width: 150px;
  padding: var(--spacing-16) var(--spacing-24);
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-button:hover {
  background: var(--color-background);
  color: var(--color-text-primary);
}

.tab-button--active {
  background: white;
  color: var(--color-accent-base);
  border-bottom: 3px solid var(--color-accent-base);
  margin-bottom: -2px;
}

.tabs-content {
  padding: var(--spacing-32);
  min-height: 400px;
}

.formatting-footer {
  text-align: center;
  margin-top: var(--spacing-48);
}

.formatting-footer__hint {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: var(--spacing-12);
}

@media (max-width: 768px) {
  .formatting-header__title {
    font-size: 24px;
  }
  
  .formatting-actions {
    flex-direction: column;
  }
  
  .tabs-header {
    overflow-x: scroll;
  }
  
  .tab-button {
    min-width: 120px;
    padding: var(--spacing-12) var(--spacing-16);
    font-size: 13px;
  }
  
  .tabs-content {
    padding: var(--spacing-20);
  }
}
`

export default GenerationFormattingPage
