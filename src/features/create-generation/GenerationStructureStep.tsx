/**
 * GenerationStructureStep
 * Шаг 3: Структура (содержание)
 * Redesigned to match the reference image with chapter containers and sub-sections.
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
    const itemToDelete = items.find(i => i.id === id)
    if (!itemToDelete) return

    let newItems: StructureItem[] = []
    if (itemToDelete.level === 1) {
      // If deleting a chapter, also delete its sub-sections
      const index = items.indexOf(itemToDelete)
      let count = 1
      for (let i = index + 1; i < items.length; i++) {
        if (items[i].level === 2) count++
        else break
      }
      newItems = [...items]
      newItems.splice(index, count)
    } else {
      newItems = items.filter(item => item.id !== id)
    }
    
    setItems(newItems)
    onChange(newItems)
  }

  const handleAddChapter = () => {
    const newItem: StructureItem = {
      id: `chapter-${Date.now()}`,
      title: 'Новая глава',
      level: 1
    }
    const newItems = [...items, newItem]
    setItems(newItems)
    onChange(newItems)
  }

  const handleAddSubSection = (chapterId: string) => {
    const chapterIndex = items.findIndex(i => i.id === chapterId)
    if (chapterIndex === -1) return

    // Find the end of this chapter's sub-sections
    let insertIndex = chapterIndex + 1
    while (insertIndex < items.length && items[insertIndex].level === 2) {
      insertIndex++
    }

    const newItem: StructureItem = {
      id: `sub-${Date.now()}`,
      title: 'Новый подраздел',
      level: 2
    }

    const newItems = [...items]
    newItems.splice(insertIndex, 0, newItem)
    setItems(newItems)
    onChange(newItems)
  }

  const moveChapter = (id: string, direction: 'up' | 'down') => {
    const chapterIndex = items.findIndex(i => i.id === id)
    if (chapterIndex === -1) return

    // Identify the full range of the chapter (chapter + its sub-sections)
    let chapterRangeCount = 1
    while (chapterIndex + chapterRangeCount < items.length && items[chapterIndex + chapterRangeCount].level === 2) {
      chapterRangeCount++
    }

    const newItems = [...items]
    const chapterRange = newItems.splice(chapterIndex, chapterRangeCount)

    if (direction === 'up') {
      // Find the previous chapter's start index
      let prevChapterIndex = chapterIndex - 1
      while (prevChapterIndex > 0 && items[prevChapterIndex].level === 2) {
        prevChapterIndex--
      }
      if (prevChapterIndex < 0) return // Already at top
      newItems.splice(prevChapterIndex, 0, ...chapterRange)
    } else {
      // Find the next chapter's end index
      const nextChapterIndex = chapterIndex + chapterRangeCount
      if (nextChapterIndex >= items.length) return // Already at bottom
      
      let nextChapterRangeCount = 1
      while (nextChapterIndex + nextChapterRangeCount < items.length && items[nextChapterIndex + nextChapterRangeCount].level === 2) {
        nextChapterRangeCount++
      }
      newItems.splice(nextChapterIndex + nextChapterRangeCount - chapterRangeCount, 0, ...chapterRange)
    }

    setItems(newItems)
    onChange(newItems)
  }

  const moveSubSection = (subId: string, chapterId: string, direction: 'up' | 'down') => {
    console.log('moveSubSection called:', { subId, chapterId, direction })
    
    const chapterIndex = items.findIndex(i => i.id === chapterId)
    if (chapterIndex === -1) {
      console.log('Chapter not found')
      return
    }

    // Find all sub-sections of this chapter
    const subSections: StructureItem[] = []
    let i = chapterIndex + 1
    while (i < items.length && items[i].level === 2) {
      subSections.push(items[i])
      i++
    }

    console.log('Found subSections:', subSections.length, subSections.map(s => s.id))

    const subIndex = subSections.findIndex(s => s.id === subId)
    console.log('subIndex:', subIndex)
    
    if (subIndex === -1) {
      console.log('Subsection not found in chapter')
      return
    }

    if (direction === 'up' && subIndex === 0) {
      console.log('Already at top')
      return // Already at top
    }
    if (direction === 'down' && subIndex === subSections.length - 1) {
      console.log('Already at bottom')
      return // Already at bottom
    }

    // Swap with adjacent sub-section
    const newSubSections = [...subSections]
    if (direction === 'up') {
      [newSubSections[subIndex - 1], newSubSections[subIndex]] = [newSubSections[subIndex], newSubSections[subIndex - 1]]
    } else {
      [newSubSections[subIndex], newSubSections[subIndex + 1]] = [newSubSections[subIndex + 1], newSubSections[subIndex]]
    }

    console.log('Swapped, updating items')

    // Reconstruct items array
    const newItems = [...items]
    newItems.splice(chapterIndex + 1, subSections.length, ...newSubSections)
    
    setItems(newItems)
    onChange(newItems)
  }

  // Group items into chapters for easier rendering
  const chapters: { chapter: StructureItem; subSections: StructureItem[] }[] = []
  let currentChapter: { chapter: StructureItem; subSections: StructureItem[] } | null = null

  items.forEach(item => {
    if (item.level === 1) {
      currentChapter = { chapter: item, subSections: [] }
      chapters.push(currentChapter)
    } else if (currentChapter) {
      currentChapter.subSections.push(item)
    }
  })

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
        <Stack gap="lg">
          {chapters.map(({ chapter, subSections }, chapterIdx) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: chapterIdx * 0.1 }}
            >
              <Card variant="default" style={{ padding: 0, overflow: 'visible', position: 'relative' }}>
                {/* Chapter Header */}
                <div style={{ 
                  padding: 'var(--spacing-16) var(--spacing-20)', 
                  backgroundColor: 'var(--color-neutral-10)',
                  borderBottom: '1px solid var(--color-border-light)',
                  borderTopLeftRadius: 'var(--radius-xl)',
                  borderTopRightRadius: 'var(--radius-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-12)'
                }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-neutral-100)', minWidth: '80px' }}>
                    Глава {chapterIdx + 1}.
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input
                      value={chapter.title}
                      onChange={(e) => handleTitleChange(chapter.id, e.target.value)}
                      style={{ 
                        border: 'none', 
                        padding: '4px 0', 
                        fontSize: '18px',
                        fontWeight: '700',
                        backgroundColor: 'transparent',
                        boxShadow: 'none'
                      }}
                    />
                  </div>

                  {/* Actions for Chapter */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '-20px', 
                    right: '20px',
                    display: 'flex',
                    backgroundColor: 'white',
                    border: '1px solid var(--color-border-base)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--elevation-2)',
                    zIndex: 10
                  }}>
                    <Tooltip content="Добавить подраздел">
                      <Button variant="ghost" size="sm" onClick={() => handleAddSubSection(chapter.id)}>
                        <span style={{ fontSize: '18px' }}>+</span>
                      </Button>
                    </Tooltip>
                    <div style={{ width: '1px', backgroundColor: 'var(--color-border-light)', margin: '8px 0' }} />
                    <Tooltip content="Вверх">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => moveChapter(chapter.id, 'up')}
                        disabled={chapterIdx === 0}
                      >
                        <span style={{ fontSize: '18px' }}>↑</span>
                      </Button>
                    </Tooltip>
                    <Tooltip content="Вниз">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => moveChapter(chapter.id, 'down')}
                        disabled={chapterIdx === chapters.length - 1}
                      >
                        <span style={{ fontSize: '18px' }}>↓</span>
                      </Button>
                    </Tooltip>
                    <div style={{ width: '1px', backgroundColor: 'var(--color-border-light)', margin: '8px 0' }} />
                    <Tooltip content="Удалить главу">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(chapter.id)}>
                        <span style={{ fontSize: '16px' }}>🗑️</span>
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                {/* Sub-sections */}
                <div style={{ padding: 'var(--spacing-12) var(--spacing-20)' }}>
                  <Stack gap="xs">
                    {subSections.length > 0 ? subSections.map((sub, subIdx) => (
                      <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)' }}>
                        <div style={{ 
                          fontSize: 'var(--font-size-sm)', 
                          color: 'var(--color-text-muted)',
                          minWidth: '35px',
                          fontWeight: '600'
                        }}>
                          {chapterIdx + 1}.{subIdx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Input
                            value={sub.title}
                            onChange={(e) => handleTitleChange(sub.id, e.target.value)}
                            style={{ 
                              border: 'none', 
                              padding: '8px 0', 
                              fontSize: 'var(--font-size-base)',
                              backgroundColor: 'transparent',
                              boxShadow: 'none'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <Tooltip content="Вверх">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => moveSubSection(sub.id, chapter.id, 'up')}
                              disabled={subIdx === 0}
                              style={{ opacity: subIdx === 0 ? 0.3 : 0.6, padding: '4px 8px' }}
                            >
                              ↑
                            </Button>
                          </Tooltip>
                          <Tooltip content="Вниз">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => moveSubSection(sub.id, chapter.id, 'down')}
                              disabled={subIdx === subSections.length - 1}
                              style={{ opacity: subIdx === subSections.length - 1 ? 0.3 : 0.6, padding: '4px 8px' }}
                            >
                              ↓
                            </Button>
                          </Tooltip>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(sub.id)}
                            style={{ opacity: 0.4, padding: '4px 8px' }}
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding: '12px 0', color: 'var(--color-text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                        В этой главе пока нет подразделов
                      </div>
                    )}
                  </Stack>
                </div>
              </Card>
            </motion.div>
          ))}
          
          <Button 
            variant="secondary" 
            size="lg"
            onClick={handleAddChapter}
            style={{ 
              borderStyle: 'dashed', 
              marginTop: 'var(--spacing-12)',
              width: '100%',
              backgroundColor: 'var(--color-neutral-10)',
              borderRadius: 'var(--radius-xl)',
              height: '64px',
              fontSize: '18px'
            }}
          >
            + Добавить главу
          </Button>
        </Stack>
      </div>
    </motion.div>
  )
}

export default GenerationStructureStep

