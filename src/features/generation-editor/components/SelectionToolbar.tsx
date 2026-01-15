/**
 * SelectionToolbar
 * Тулбар с AI-кнопками, появляющийся при выделении текста
 */

import { useState, useEffect, useCallback } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection } from 'lexical'
import { aiEditText } from '@/shared/api/ai-editing'
import { useToast } from '@/ui/primitives/Toast'

interface SelectionToolbarProps {
  generationId: string
}

function SelectionToolbar({ generationId }: SelectionToolbarProps) {
  const [editor] = useLexicalComposerContext()
  const { showToast } = useToast()
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const updatePosition = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setPosition(null)
      setSelectedText('')
      return
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    
    setPosition({
      top: rect.top + window.scrollY - 50,
      left: rect.left + window.scrollX + rect.width / 2,
    })
    setSelectedText(selection.toString())
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', updatePosition)
    window.addEventListener('resize', updatePosition)
    
    return () => {
      document.removeEventListener('selectionchange', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, []) // Убрали updatePosition из зависимостей - он стабилен благодаря useCallback

  const handleAIAction = async (action: 'rewrite' | 'shorter' | 'longer') => {
    if (!selectedText || isProcessing) return
    
    setIsProcessing(true)
    try {
      const result = await aiEditText(generationId, {
        text: selectedText,
        action,
      })
      
      // Заменить выделенный текст на отредактированный
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          selection.insertText(result.edited_text)
        }
      })
      
      showToast('Текст обработан', 'success')
      setPosition(null)
    } catch (error) {
      console.error('AI edit failed:', error)
      showToast('Не удалось обработать текст', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!position) return null

  // Inject styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'selection-toolbar-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = toolbarStyles
    }
  }, [])

  return (
    <div
      className="selection-toolbar"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <button
        className="selection-toolbar__button"
        onClick={() => handleAIAction('rewrite')}
        disabled={isProcessing}
        title="Переписать текст"
      >
        🔄 Переписать
      </button>
      <button
        className="selection-toolbar__button"
        onClick={() => handleAIAction('shorter')}
        disabled={isProcessing}
        title="Сделать короче"
      >
        ✂️ Короче
      </button>
      <button
        className="selection-toolbar__button"
        onClick={() => handleAIAction('longer')}
        disabled={isProcessing}
        title="Сделать длиннее"
      >
        📏 Длиннее
      </button>
    </div>
  )
}

const toolbarStyles = `
.selection-toolbar {
  z-index: 1000;
  display: flex;
  gap: var(--spacing-8);
  padding: var(--spacing-8);
  background: white;
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  animation: fadeInUp 0.2s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.selection-toolbar__button {
  padding: var(--spacing-8) var(--spacing-16);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-md);
  background: white;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.selection-toolbar__button:hover:not(:disabled) {
  background: var(--color-accent-light);
  border-color: var(--color-accent-base);
  color: var(--color-accent-base);
  transform: translateY(-2px);
}

.selection-toolbar__button:active:not(:disabled) {
  transform: translateY(0);
}

.selection-toolbar__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .selection-toolbar {
    flex-direction: column;
    gap: var(--spacing-4);
  }
  
  .selection-toolbar__button {
    font-size: 12px;
    padding: var(--spacing-6) var(--spacing-12);
  }
}
`

export default SelectionToolbar

