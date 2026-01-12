/**
 * ResultContent component
 * Отображение результата генерации с функциями умного редактирования
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Button, Stack, Formula } from '@/ui'
import { smartEdit, type Generation } from '@/shared/api/generations'
import { useParams } from 'react-router-dom'
import { useState, useEffect, Fragment } from 'react'
import { useToast } from '@/ui/primitives/Toast'

interface ResultContentProps {
  content: string
  type: 'TEXT' | 'PRESENTATION' | 'TASK' | 'GOST_FORMAT'
  onUpdate?: (generation: Generation) => void
}

function ResultContent({ content, onUpdate }: ResultContentProps) {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()
  const [localContent, setLocalContent] = useState(content)
  const [isSaving, setIsSaving] = useState(false)
  const shouldReduceMotion = false

  // Автосохранение (Debounce)
  useEffect(() => {
    if (localContent === content) return

    setIsSaving(true)
    const timer = setTimeout(async () => {
      if (!id) return
      try {
        await smartEdit(id, 'Автосохранение', localContent)
        console.log('Changes autosaved')
        setIsSaving(false)
      } catch (error) {
        console.error('Autosave failed:', error)
        setIsSaving(false)
        showToast('Ошибка при автосохранении', 'error')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [localContent, content, id, showToast])

  const handleSmartEdit = async (action: string) => {
    if (!id) return
    setIsSaving(true)
    try {
      const updated = await smartEdit(id, action, content)
      onUpdate?.(updated)
      showToast(`Применено: ${action}`, 'success')
    } catch (error) {
      console.error('Smart edit failed:', error)
      showToast('Ошибка при обработке текста', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const renderTextWithFormulas = (text: string) => {
    // Регулярка для поиска $$...$$ или $...$
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g)
    
    return parts.map((part, i) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return <Formula key={i} tex={part.slice(2, -2)} block />
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        return <Formula key={i} tex={part.slice(1, -1)} />
      }
      return <Fragment key={i}>{part}</Fragment>
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
      }}
    >
      <Stack gap="md">
        <Card className="result-content-card">
          <div
            className="result-content"
            style={{
              fontFamily: 'var(--font-family-sans)',
              fontSize: 'var(--font-size-base)',
              lineHeight: 'var(--line-height-relaxed)',
              color: 'var(--color-text-primary)',
              padding: 'var(--spacing-24)',
            }}
          >
            {content.split('\n\n').map((paragraph, index) => {
              if (paragraph.trim() === '') return null

              if (paragraph.startsWith('# ')) {
                return (
                  <h2 key={index} style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginTop: index > 0 ? 'var(--spacing-32)' : '0', marginBottom: 'var(--spacing-12)' }}>
                    {renderTextWithFormulas(paragraph.replace('# ', ''))}
                  </h2>
                )
              }

              if (paragraph.startsWith('## ')) {
                return (
                  <h3 key={index} style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginTop: index > 0 ? 'var(--spacing-24)' : '0', marginBottom: 'var(--spacing-12)' }}>
                    {renderTextWithFormulas(paragraph.replace('## ', ''))}
                  </h3>
                )
              }

              return (
                <p key={index} style={{ marginTop: 'var(--spacing-16)', marginBottom: 'var(--spacing-16)' }}>
                  <textarea
                    value={paragraph}
                    onChange={(e) => {
                      const newParagraphs = localContent.split('\n\n')
                      newParagraphs[index] = e.target.value
                      setLocalContent(newParagraphs.join('\n\n'))
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      lineHeight: 'inherit',
                      color: 'inherit',
                      resize: 'none',
                      padding: 0,
                      outline: 'none'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = `${target.scrollHeight}px`
                    }}
                  />
                  {renderTextWithFormulas(paragraph)}
                </p>
              )
            })}
          </div>
        </Card>

        <Card style={{ backgroundColor: 'var(--color-neutral-10)', border: '1px dashed var(--color-border-base)' }}>
          <div style={{ padding: 'var(--spacing-16)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
              🪄 Умное редактирование
            </h4>
            {isSaving && (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-base)', fontWeight: 'medium' }}>
                ⏳ Сохранение...
              </span>
            )}
          </div>
          <div style={{ padding: '0 var(--spacing-16) var(--spacing-16) var(--spacing-16)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-12)', flexWrap: 'wrap' }}>
              <Button variant="secondary" size="sm" onClick={() => handleSmartEdit('Сделать короче')}>
                Сжать текст
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleSmartEdit('Академический стиль')}>
                Более научно
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleSmartEdit('Упростить')}>
                Проще
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleSmartEdit('Перегенерировать главу')}>
                Переписать всё
              </Button>
            </div>
          </div>
        </Card>
      </Stack>
    </motion.div>
  )
}

export default ResultContent

const contentStyles = `
.result-content-card {
  max-height: 600px;
  overflow-y: auto;
}

.result-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}
`

if (typeof document !== 'undefined') {
  const styleId = 'result-content-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = contentStyles
    document.head.appendChild(style)
  }
}
