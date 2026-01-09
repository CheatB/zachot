/**
 * GenerationStructureStep
 * Шаг 3: Структура (содержание)
 * Updated for "juicy" landing page aesthetic
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Button, Stack, Input } from '@/ui'
import type { StructureItem } from './types'
import { useState, useEffect } from 'react'

interface GenerationStructureStepProps {
  structure: StructureItem[]
  onChange: (structure: StructureItem[]) => void
}

function GenerationStructureStep({ structure, onChange }: GenerationStructureStepProps) {
  const [items, setItems] = useState<StructureItem[]>(structure)

  // Синхронизируем внутреннее состояние с пропсами, если они изменились извне (например, после загрузки ИИ)
  useEffect(() => {
    if (structure.length > 0) {
      setItems(structure)
    }
  }, [structure])

  useEffect(() => {
    if (items.length === 0 && structure.length === 0) {
      // Только если реально пусто и ничего не пришло
      // Можно оставить пустым или добавить дефолт
    }
  }, [items.length, structure.length])

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
                marginLeft: item.level === 2 ? 'var(--spacing-32)' : 0,
                borderLeft: item.level === 1 ? '4px solid var(--color-accent-base)' : '1px solid var(--color-border-base)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)' }}>
                  <div 
                    style={{ 
                      width: 24, 
                      height: 24, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--color-text-muted)',
                      cursor: 'grab'
                    }}
                  >
                    ⠿
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input
                      value={item.title}
                      onChange={(e) => handleTitleChange(item.id, e.target.value)}
                      style={{ 
                        border: 'none', 
                        padding: 'var(--spacing-8)', 
                        fontSize: item.level === 1 ? 'var(--font-size-base)' : 'var(--font-size-sm)',
                        fontWeight: item.level === 1 ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-primary)'
                      }}
                    />
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
