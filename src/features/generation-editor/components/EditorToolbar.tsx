/**
 * EditorToolbar
 * Панель инструментов редактора (форматирование текста)
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND } from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import { $createHeadingNode, HeadingTagType } from '@lexical/rich-text'
import { useCallback, useEffect, useState } from 'react'

function EditorToolbar() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
    }
  }, [])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar()
      })
    })
  }, [editor, updateToolbar])

  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
  }

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
  }

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
  }

  const formatHeading = (tag: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag))
      }
    })
  }

  const formatAlignLeft = () => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
  }

  const formatAlignCenter = () => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
  }

  const formatAlignJustify = () => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')
  }

  // Inject styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'editor-toolbar-styles'
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
    <div className="editor-toolbar">
      <div className="toolbar-group">
        <button
          className={`toolbar-button ${isBold ? 'toolbar-button--active' : ''}`}
          onClick={formatBold}
          title="Жирный (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          className={`toolbar-button ${isItalic ? 'toolbar-button--active' : ''}`}
          onClick={formatItalic}
          title="Курсив (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          className={`toolbar-button ${isUnderline ? 'toolbar-button--active' : ''}`}
          onClick={formatUnderline}
          title="Подчеркнутый (Ctrl+U)"
        >
          <u>U</u>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={() => formatHeading('h1')}
          title="Заголовок 1"
        >
          H1
        </button>
        <button
          className="toolbar-button"
          onClick={() => formatHeading('h2')}
          title="Заголовок 2"
        >
          H2
        </button>
        <button
          className="toolbar-button"
          onClick={() => formatHeading('h3')}
          title="Заголовок 3"
        >
          H3
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={formatAlignLeft}
          title="По левому краю"
        >
          ☰
        </button>
        <button
          className="toolbar-button"
          onClick={formatAlignCenter}
          title="По центру"
        >
          ☷
        </button>
        <button
          className="toolbar-button"
          onClick={formatAlignJustify}
          title="По ширине"
        >
          ☶
        </button>
      </div>
    </div>
  )
}

const toolbarStyles = `
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-8);
  padding: var(--spacing-12) var(--spacing-16);
  background: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border-base);
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: var(--spacing-4);
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-md);
  background: white;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-button:hover {
  background: var(--color-accent-light);
  border-color: var(--color-accent-base);
  color: var(--color-accent-base);
}

.toolbar-button--active {
  background: var(--color-accent-base);
  border-color: var(--color-accent-base);
  color: white;
}

.toolbar-button--active:hover {
  background: var(--color-accent-dark);
  border-color: var(--color-accent-dark);
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border-base);
  margin: 0 var(--spacing-4);
}

@media (max-width: 768px) {
  .editor-toolbar {
    padding: var(--spacing-8);
    gap: var(--spacing-4);
  }
  
  .toolbar-button {
    width: 32px;
    height: 32px;
    font-size: 13px;
  }
}
`

export default EditorToolbar

