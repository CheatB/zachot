/**
 * GenerationStructureStep
 * Шаг 3: Структура (содержание)
 * Updated with hierarchical numbering, larger icons with borders, and tooltips.
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Button, Stack, Input, Tooltip } from '@/ui'
import type { StructureItem } from './types'
import { useState, useEffect } from 'react'

interface GenerationStructureStepProps {
  structure: StructureItem[]
  onChange: (structure: StructureItem[]) => void
}

function GenerationStructureStep({ structure, onChange }: GenerationStructureStepProps) {
  const [items, setItems] = useState<StructureItem[]>(structure)

  useEffect(() => {
    if (structure.length > 0) {
      setItems(structure)
    }
  }, [structure])

  const handleTitleChange = (id: string, newTitle: string) => {
    const newItems = items.map(item => item.id === id ? { ...item, title: newTitle } : item)
    setItems(newItems)
    onChange(newItems)
  }

  const handleDelete = (id: string) => {
    const newItems = items.filter(item => item.id !== id)
    setItems(newItems)
    onChange(newItems)
  }

  const handleAdd = () => {
    const newItem: StructureItem = {
      id: Date.now().toString(),
      title: 'Новый раздел',
      level: 1
    }
    const newItems = [...items, newItem]
    setItems(newItems)
    onChange(newItems)
  }

  const getNumbering = (index: number) => {
    let level1Count = 0
    let level2Count = 0
    
    for (let i = 0; i <= index; i++) {
      if (items[i].level === 1) {
        level1Count++
        level2Count = 0
      } else {
        level2Count++
      }
    }
    
    return items[index].level === 1 ? `${level1Count}.` : `${level1Count}.${level2Count}.`
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
        <Stack gap="sm">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="default" style={{ 
                padding: 'var(--spacing-12) var(--spacing-16)',
                marginLeft: item.level === 2 ? 'var(--spacing-40)' : 0,
                borderLeft: item.level === 1 ? '4px solid var(--color-accent-base)' : '1px solid var(--color-border-base)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-16)' }}>
                  <div style={{ 
                    fontSize: item.level === 1 ? '24px' : '20px', 
                    fontWeight: 'bold', 
                    color: 'var(--color-accent-base)',
                    minWidth: '35px'
                  }}>
                    {getNumbering(index)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <Input
                      value={item.title}
                      onChange={(e) => handleTitleChange(item.id, e.target.value)}
                      style={{ 
                        border: 'none', 
                        padding: 'var(--spacing-4)', 
                        fontSize: item.level === 1 ? '24px' : '20px',
                        fontWeight: item.level === 1 ? 'bold' : '500',
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--spacing-12)' }}>
                    <Tooltip content="Эта кнопка позволяет перегенерировать название этого раздела">
                      <div style={{ display: 'inline-block' }}>
                        <Button 
                          variant="ghost" 
                          size="md" 
                          onClick={() => {
                            // Имитация перегенерации конкретного раздела
                            handleTitleChange(item.id, item.title + " (обновлено)")
                          }} 
                          style={{ 
                            padding: '12px', 
                            border: '2px solid var(--color-accent-base)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-accent-base)',
                            backgroundColor: 'white'
                          }}
                        >
                          <span style={{ fontSize: '28px' }}>🪄</span>
                        </Button>
                      </div>
                    </Tooltip>
                    <Button 
                      variant="ghost" 
                      size="md" 
                      onClick={() => handleDelete(item.id)}
                      style={{ 
                        color: 'var(--color-accent-base)', 
                        padding: '12px',
                        border: '2px solid var(--color-accent-base)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'white'
                      }}
                    >
                      <span style={{ fontSize: '24px', fontWeight: 'bold' }}>✕</span>
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          
          <Button 
            variant="secondary" 
            size="lg"
            onClick={handleAdd}
            style={{ 
              borderStyle: 'dashed', 
              marginTop: 'var(--spacing-24)',
              width: '100%',
              backgroundColor: 'var(--color-neutral-10)'
            }}
          >
            + Добавить раздел
          </Button>
        </Stack>
      </div>
    </motion.div>
  )
}

export default GenerationStructureStep
