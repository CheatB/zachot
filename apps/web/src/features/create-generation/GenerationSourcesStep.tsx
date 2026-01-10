/**
 * GenerationSourcesStep
 * Шаг 4: Источники информации
 * Updated with file upload, real search logic, and specific badge logic.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Button, Stack, Badge } from '@/ui'
import type { SourceItem } from './types'
import { useState, useEffect, useRef } from 'react'
import { suggestSources } from '@/shared/api/admin'
import { useCreateStore } from './store/useCreateStore'

interface GenerationSourcesStepProps {
  sources: SourceItem[]
  onChange: (sources: SourceItem[]) => void
}

function GenerationSourcesStep({ sources, onChange }: GenerationSourcesStepProps) {
  const [items, setItems] = useState<SourceItem[]>(sources)
  const [isSearching, setIsSearching] = useState(false)
  const searchCountRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { form } = useCreateStore()

  useEffect(() => {
    setItems(sources)
  }, [sources])

  const handleDelete = (id: string) => {
    const newItems = items.filter(item => item.id !== id)
    setItems(newItems)
    onChange(newItems)
  }

  const handleSearchMore = async () => {
    if (searchCountRef.current >= 3) {
      alert('Вы уже выполнили 3 дополнительных поиска. Используйте найденные источники.')
      return
    }

    setIsSearching(true)
    try {
      const data = await suggestSources({
        topic: form.input,
        workType: form.workType || 'other',
        volume: form.volume,
        complexity: form.complexityLevel
      })
      
      const newSources = data.sources.map((item, idx) => ({
        ...item,
        id: `extra-${searchCountRef.current}-${idx}-${Date.now()}`
      }))
      
      const combined = [...items, ...newSources]
      setItems(combined)
      onChange(combined)
      searchCountRef.current += 1
    } catch (err) {
      console.error('Failed to search more sources:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFileSources: SourceItem[] = Array.from(files).map(file => {
      const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE'
      return {
        id: `file-${Date.now()}-${Math.random()}`,
        title: file.name,
        description: `Загруженный документ (${extension}) — ${(file.size / 1024 / 1024).toFixed(2)} MB`,
        isAiSelected: false
      }
    })

    const combined = [...items, ...newFileSources]
    setItems(combined)
    onChange(combined)
  }

  const getFileIcon = (title: string) => {
    const ext = title.split('.').pop()?.toUpperCase() || ''
    if (ext === 'PDF') return '📕'
    if (['DOC', 'DOCX'].includes(ext)) return '📘'
    return '📄'
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
        <Stack gap="md">
          <AnimatePresence>
            {items.map((item, index) => {
              // Плашка "Рекомендовано" только для первых 4-х источников в списке
              const showBadge = item.isAiSelected && index < 4;
              const isFile = item.id.startsWith('file-');
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card variant="default" style={{ 
                    padding: 'var(--spacing-20)', 
                    borderRadius: 'var(--radius-lg)',
                    border: isFile ? '2px solid var(--color-accent-light)' : '1px solid var(--color-border-base)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '24px' }}>
                            {isFile ? getFileIcon(item.title) : '📚'}
                          </span>
                          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', color: 'var(--color-neutral-100)' }}>
                            {item.title}
                          </h3>
                          {showBadge && <Badge status="success">Рекомендовано</Badge>}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(item.id)}
                          style={{ color: 'var(--color-text-muted)', padding: '4px' }}
                        >
                          ✕
                        </Button>
                      </div>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                        {item.description}
                      </p>
                      {item.url && (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            fontSize: 'var(--font-size-xs)', 
                            color: 'var(--color-accent-base)', 
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            textDecoration: 'none'
                          }}
                        >
                          🔗 Перейти к источнику
                        </a>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-16)', marginTop: 'var(--spacing-24)' }}>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              multiple 
              accept=".pdf,.doc,.docx,.txt,.rtf"
              onChange={handleFileUpload}
            />
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={() => fileInputRef.current?.click()}
              style={{ flex: 1, borderStyle: 'dashed', backgroundColor: 'var(--color-neutral-10)', height: '56px', borderRadius: '12px' }}
            >
              + Загрузить свой файл
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              loading={isSearching}
              onClick={handleSearchMore}
              style={{ flex: 1, borderStyle: 'dashed', backgroundColor: 'var(--color-neutral-10)', height: '56px', borderRadius: '12px' }}
            >
              🔍 Поискать еще
            </Button>
          </div>
        </Stack>
      </div>
    </motion.div>
  )
}

export default GenerationSourcesStep
