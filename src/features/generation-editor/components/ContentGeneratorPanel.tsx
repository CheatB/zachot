/**
 * ContentGeneratorPanel
 * Панель для генерации дополнительного контента (графики, таблицы, произвольные команды)
 */

import { useState, useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection } from 'lexical'
import { aiGenerateContent } from '@/shared/api/ai-editing'
import { Button, Input } from '@/ui'
import { useToast } from '@/ui/primitives/Toast'

interface ContentGeneratorPanelProps {
  generationId: string
}

function ContentGeneratorPanel({ generationId }: ContentGeneratorPanelProps) {
  const [editor] = useLexicalComposerContext()
  const { showToast } = useToast()
  const [customInstruction, setCustomInstruction] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleGenerate = async (type: 'chart' | 'table' | 'custom') => {
    if (type === 'custom' && !customInstruction.trim()) {
      showToast('Введите команду для AI', 'error')
      return
    }
    
    setIsProcessing(true)
    try {
      const result = await aiGenerateContent(generationId, {
        type,
        instruction: type === 'custom' ? customInstruction : undefined,
      })
      
      // Вставить сгенерированный контент в позицию курсора
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          selection.insertText(`\n\n${result.content}\n\n`)
        }
      })
      
      showToast('Контент добавлен', 'success')
      if (type === 'custom') {
        setCustomInstruction('')
      }
    } catch (error) {
      console.error('Content generation failed:', error)
      showToast('Не удалось сгенерировать контент', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  // Inject styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'content-generator-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = panelStyles
    }
  }, [])

  return (
    <div className="content-generator">
      <div className="content-generator__header">
        <h3 className="content-generator__title">Создать на базе текста</h3>
      </div>

      <div className="content-generator__actions">
        <button
          className="generator-button"
          onClick={() => handleGenerate('chart')}
          disabled={isProcessing}
        >
          📊 График
        </button>
        <button
          className="generator-button"
          onClick={() => handleGenerate('table')}
          disabled={isProcessing}
        >
          📋 Таблицу
        </button>
      </div>

      <div className="content-generator__custom">
        <Input
          value={customInstruction}
          onChange={(e) => setCustomInstruction(e.target.value)}
          placeholder="Напиши AI, что нужно сделать..."
          disabled={isProcessing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleGenerate('custom')
            }
          }}
        />
        <Button
          variant="primary"
          onClick={() => handleGenerate('custom')}
          disabled={isProcessing || !customInstruction.trim()}
        >
          {isProcessing ? 'Генерация...' : 'Создать'}
        </Button>
      </div>
    </div>
  )
}

const panelStyles = `
.content-generator {
  border-top: 1px solid var(--color-border-base);
  padding: var(--spacing-24) var(--spacing-32);
  background: var(--color-background-secondary);
}

.content-generator__header {
  margin-bottom: var(--spacing-16);
}

.content-generator__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-neutral-100);
  margin: 0;
}

.content-generator__actions {
  display: flex;
  gap: var(--spacing-12);
  margin-bottom: var(--spacing-20);
}

.generator-button {
  flex: 1;
  padding: var(--spacing-12) var(--spacing-16);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-lg);
  background: white;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.generator-button:hover:not(:disabled) {
  background: var(--color-accent-light);
  border-color: var(--color-accent-base);
  color: var(--color-accent-base);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.generator-button:active:not(:disabled) {
  transform: translateY(0);
}

.generator-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.content-generator__custom {
  display: flex;
  gap: var(--spacing-12);
  align-items: center;
}

.content-generator__custom input {
  flex: 1;
}

@media (max-width: 768px) {
  .content-generator {
    padding: var(--spacing-16);
  }
  
  .content-generator__actions {
    flex-direction: column;
  }
  
  .content-generator__custom {
    flex-direction: column;
    align-items: stretch;
  }
  
  .content-generator__custom button {
    width: 100%;
  }
}
`

export default ContentGeneratorPanel

