/**
 * GenerationSourcesStep
 * Шаг 5: Источники информации
 * Redesigned to match the reference image exactly.
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Button, Tooltip } from '@/ui'
import type { SourceItem } from './types'
import { useState, useEffect, useRef } from 'react'
import { searchMoreSources, uploadFileSource } from '@/shared/api/generations'
import { useToast } from '@/ui/primitives/Toast'

interface GenerationSourcesStepProps {
  sources: SourceItem[]
  onChange: (sources: SourceItem[]) => void
  generationId?: string | null
}

function GenerationSourcesStep({ sources, onChange, generationId }: GenerationSourcesStepProps) {
  const [items, setItems] = useState<SourceItem[]>(sources)
  const [isSearching, setIsSearching] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (sources.length > 0) {
      setItems(sources)
    }
  }, [sources])

  const handleDelete = (id: string) => {
    const newItems = items.filter(item => item.id !== id)
    setItems(newItems)
    onChange(newItems)
  }

  const handleSearchMore = async () => {
    if (!generationId) {
      showToast('Сначала сохраните черновик работы', 'error')
      return
    }

    setIsSearching(true)
    try {
      const result = await searchMoreSources(generationId, items.length)
      if (result.success) {
        setItems(result.sources)
        onChange(result.sources)
        showToast(`Добавлено ${result.new_sources?.length || 0} новых источников! 🎉`, 'success')
      } else {
        showToast(result.message || 'Не удалось найти новые источники', 'info')
      }
    } catch (error) {
      console.error('Error searching more sources:', error)
      showToast('Ошибка при поиске источников', 'error')
    } finally {
      setIsSearching(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!generationId) {
      showToast('Сначала сохраните черновик работы', 'error')
      return
    }

    // Проверка типа файла
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      showToast('Поддерживаются только файлы PDF, DOCX и TXT', 'error')
      return
    }

    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Размер файла не должен превышать 10 МБ', 'error')
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadFileSource(generationId, file)
      if (result.success) {
        setItems(result.sources)
        onChange(result.sources)
        showToast(`Файл "${file.name}" успешно добавлен как источник! 📄`, 'success')
      } else {
        showToast(result.message || 'Не удалось загрузить файл', 'error')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      showToast('Ошибка при загрузке файла', 'error')
    } finally {
      setIsUploading(false)
      // Сбрасываем input чтобы можно было загрузить тот же файл снова
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Inject styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'sources-step-styles-v2'
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
      <div className="sources-container-v2">
        <h1 className="sources-main-title">Ознакомься с источниками</h1>
        
        <div className="sources-card">
          <div className="sources-grid">
            {/* Header Row */}
            <div className="sources-grid__header">
              <div className="header-cell left-cell">Источники</div>
              <div className="header-cell right-cell">Почему используем в работе</div>
            </div>

            {/* Content Rows */}
            <div className="sources-grid__body">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="source-row">
                    <div className="source-row__left">
                      <div className="source-row__content">
                        <div className="source-icon">
                          <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="24" height="32" rx="4" fill="#F43F5E"/>
                            <path d="M6 10H18M6 16H18M6 22H14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <text x="4" y="28" fill="white" fontSize="6" fontWeight="bold" fontFamily="sans-serif">PDF</text>
                          </svg>
                        </div>
                        <div className="source-details">
                          <div className="source-title-row">
                            {item.url ? (
                              <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="source-title-link"
                              >
                                {item.title}
                              </a>
                            ) : (
                              <h4 className="source-title">{item.title}</h4>
                            )}
                            {/* Индикаторы валидности */}
                            {item.isVerified && (
                              <Tooltip content="Источник проверен и доступен">
                                <span className="source-badge source-badge--verified">
                                  ✓ Проверен
                                </span>
                              </Tooltip>
                            )}
                            {item.isTrustedDomain && (
                              <Tooltip content="Источник из надёжной научной базы">
                                <span className="source-badge source-badge--trusted">
                                  🛡️ Надёжный домен
                                </span>
                              </Tooltip>
                            )}
                            {/* QC индикатор релевантности */}
                            {item.relevanceScore !== undefined && item.relevanceScore >= 7 && (
                              <Tooltip content={`Высокая релевантность: ${item.relevanceScore}/10${item.qcReason ? ` - ${item.qcReason}` : ''}`}>
                                <span className="source-badge source-badge--relevant">
                                  ⭐ Релевантен ({item.relevanceScore}/10)
                                </span>
                              </Tooltip>
                            )}
                            {item.relevanceScore !== undefined && item.relevanceScore >= 4 && item.relevanceScore < 7 && (
                              <Tooltip content={`Средняя релевантность: ${item.relevanceScore}/10${item.qcReason ? ` - ${item.qcReason}` : ''}`}>
                                <span className="source-badge source-badge--moderate">
                                  📊 Релевантен ({item.relevanceScore}/10)
                                </span>
                              </Tooltip>
                            )}
                          </div>
                          <p className="source-meta">
                            {item.isAiSelected ? 'Проверенный академический источник' : 'Пользовательский файл'}
                          </p>
                        </div>
                      </div>
                      <div className="source-row__actions">
                        <Tooltip content="Открыть оригинал">
                          <button 
                            className="source-btn" 
                            onClick={() => item.url && window.open(item.url, '_blank')}
                            disabled={!item.url}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </Tooltip>
                        <Tooltip content="Удалить источник">
                          <button className="source-btn" onClick={() => handleDelete(item.id)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="source-row__right">
                      <p className="source-description">{item.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="sources-empty">Нет выбранных источников</div>
              )}
            </div>
          </div>
        </div>

        <div className="sources-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <Button 
            variant="secondary" 
            size="lg" 
            style={{ borderStyle: 'dashed', flex: 1 }}
            onClick={handleUploadClick}
            disabled={isUploading || !generationId}
          >
            {isUploading ? '⏳ Загрузка...' : '+ Загрузить свой файл'}
          </Button>
          <Button 
            variant="secondary" 
            size="lg" 
            style={{ borderStyle: 'dashed', flex: 1 }}
            onClick={handleSearchMore}
            disabled={isSearching || !generationId}
          >
            {isSearching ? '⏳ Поиск...' : '🔍 Поискать еще'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

const stepStyles = `
.sources-container-v2 {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.sources-main-title {
  font-size: 48px;
  font-weight: 800;
  text-align: center;
  color: var(--color-neutral-110);
  margin-bottom: var(--spacing-48);
  letter-spacing: -0.02em;
}

.sources-card {
  background: white;
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}

.sources-grid {
  display: flex;
  flex-direction: column;
}

.sources-grid__header {
  display: flex;
  border-bottom: 1px solid var(--color-border-light);
}

.header-cell {
  padding: var(--spacing-20) var(--spacing-32);
  padding-left: 52px; /* 32px standard + 20px extra */
  font-weight: 700;
  font-size: 18px;
  color: var(--color-neutral-100);
}

.left-cell {
  flex: 0 0 45%;
  border-right: 1px solid var(--color-border-light);
}

.right-cell {
  flex: 1;
}

.source-row {
  display: flex;
  border-bottom: 1px solid var(--color-border-light);
}

.source-row:last-child {
  border-bottom: none;
}

.source-row__left {
  flex: 0 0 45%;
  border-right: 1px solid var(--color-border-light);
  padding: var(--spacing-32);
  padding-left: 52px; /* 32px standard + 20px extra */
  display: flex;
  flex-direction: column;
  gap: var(--spacing-24);
}

.source-row__right {
  flex: 1;
  padding: var(--spacing-32);
}

.source-row__content {
  display: flex;
  gap: var(--spacing-16);
  align-items: flex-start;
}

.source-icon {
  flex-shrink: 0;
  padding-top: 4px;
}

.source-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
  position: relative;
  z-index: 10;
  flex: 1;
}

.source-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-8);
  flex-wrap: wrap;
}

.source-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-neutral-100);
}

.source-title-link {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-accent-base);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-block;
  position: relative;
  z-index: 10;
}

.source-title-link:hover {
  color: var(--color-accent-dark);
  text-decoration: underline;
}

.source-title-link:active {
  color: var(--color-accent-darker);
}

.source-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  transition: all 0.2s;
}

.source-badge--verified {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.source-badge--trusted {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #90caf9;
}

.source-badge--relevant {
  background: #fff3e0;
  color: #e65100;
  border: 1px solid #ffb74d;
}

.source-badge--moderate {
  background: #f3e5f5;
  color: #6a1b9a;
  border: 1px solid #ce93d8;
}

.source-meta {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.source-row__actions {
  display: flex;
  gap: var(--spacing-12);
  position: relative;
  z-index: 5;
}

.source-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--color-border-base);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-neutral-80);
  transition: all 0.2s ease;
  outline: none;
}

.source-btn:hover {
  border-color: var(--color-accent-base);
  color: var(--color-accent-base);
  background-color: var(--color-accent-light);
  transform: scale(1.05);
}

.source-btn:active {
  transform: scale(0.95);
}

.source-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.source-description {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text-primary);
  text-align: left;
}

.sources-empty {
  padding: var(--spacing-64);
  text-align: center;
  color: var(--color-text-muted);
}

.sources-actions {
  display: flex;
  gap: var(--spacing-16);
  margin-top: var(--spacing-32);
}

@media (max-width: 900px) {
  .sources-grid__header {
    display: none;
  }
  .source-row {
    flex-direction: column;
  }
  .source-row__left, .source-row__right {
    flex: none;
    width: 100%;
    border-right: none;
  }
  .source-row__left {
    border-bottom: 1px solid var(--color-border-light);
  }
  .sources-main-title {
    font-size: 32px;
  }
}
`

export default GenerationSourcesStep
