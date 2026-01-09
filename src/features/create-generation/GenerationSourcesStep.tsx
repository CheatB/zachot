/**
 * GenerationSourcesStep
 * Шаг 4: Источники
 * Updated for "juicy" landing page aesthetic
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Button, Stack, Badge } from '@/ui'
import type { SourceItem } from './types'
import { useState, useEffect } from 'react'

interface GenerationSourcesStepProps {
  sources: SourceItem[]
  onChange: (sources: SourceItem[]) => void
}

function GenerationSourcesStep({ sources, onChange }: GenerationSourcesStepProps) {
  const [items, setItems] = useState<SourceItem[]>(sources)

  useEffect(() => {
    if (items.length === 0) {
      const emptySources: SourceItem[] = []
      setItems(emptySources)
      onChange(emptySources)
    }
  }, [items.length, onChange])

  const handleDelete = (id: string) => {
    const newItems = items.filter(item => item.id !== id)
    setItems(newItems)
    onChange(newItems)
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
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="default" style={{ padding: 'var(--spacing-20)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)' }}>
                      <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                        {item.title}
                      </h3>
                      {item.isAiSelected && <Badge status="success">Рекомендовано</Badge>}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(item.id)}
                      style={{ color: 'var(--color-text-muted)' }}
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
                        gap: 4
                      }}
                    >
                      🔗 Перейти к источнику
                    </a>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
          
          <div style={{ display: 'flex', gap: 'var(--spacing-16)', marginTop: 'var(--spacing-24)' }}>
            <Button variant="secondary" size="lg" style={{ flex: 1, borderStyle: 'dashed', backgroundColor: 'var(--color-neutral-10)' }}>
              + Загрузить свой файл
            </Button>
            <Button variant="secondary" size="lg" style={{ flex: 1, borderStyle: 'dashed', backgroundColor: 'var(--color-neutral-10)' }}>
              🔍 Поискать еще
            </Button>
          </div>
        </Stack>
      </div>
    </motion.div>
  )
}

export default GenerationSourcesStep
