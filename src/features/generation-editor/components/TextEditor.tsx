/**
 * TextEditor
 * Rich-text редактор на базе Lexical с поддержкой AI-ассистента
 */

import { useEffect, useRef } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'
import { CodeNode } from '@lexical/code'
import { $getRoot, $createParagraphNode, $createTextNode, EditorState } from 'lexical'

import SelectionToolbar from './SelectionToolbar'
import EditorToolbar from './EditorToolbar'

interface TextEditorProps {
  initialContent: string
  onChange: (content: string) => void
  generationId: string
}

// Плагин для загрузки начального контента
function InitialContentPlugin({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext()
  const prevContentRef = useRef(content) // Track previous content
  
  useEffect(() => {
    console.log('[InitialContentPlugin] content:', content ? content.substring(0, 100) : 'EMPTY')
    if (!content || content === prevContentRef.current) { // Only update if content is new
      console.log('[InitialContentPlugin] No new content or empty, skipping')
      return
    }
    
    editor.update(() => {
      const root = $getRoot()
      root.clear()
      
      // Разбиваем текст на параграфы
      const paragraphs = content.split('\n\n')
      console.log('[InitialContentPlugin] Inserting', paragraphs.length, 'paragraphs')
      
      paragraphs.forEach((text) => {
        if (!text.trim()) return
        
        const paragraph = $createParagraphNode()
        const textNode = $createTextNode(text)
        paragraph.append(textNode)
        root.append(paragraph)
      })
    })
    prevContentRef.current = content // Update ref after processing
  }, [content, editor])
  
  return null
}

function TextEditor({ initialContent, onChange, generationId }: TextEditorProps) {
  const initialConfig = {
    namespace: 'ZachetEditor',
    theme: {
      root: 'editor-root',
      paragraph: 'editor-paragraph',
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        underline: 'editor-text-underline',
      },
      heading: {
        h1: 'editor-heading-h1',
        h2: 'editor-heading-h2',
        h3: 'editor-heading-h3',
      },
      list: {
        ul: 'editor-list-ul',
        ol: 'editor-list-ol',
        listitem: 'editor-list-item',
      },
      link: 'editor-link',
      code: 'editor-code',
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      CodeNode,
    ],
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
  }

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot()
      const text = root.getTextContent()
      onChange(text)
    })
  }

  // Inject styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'text-editor-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = editorStyles
    }
  }, [])

  return (
    <div className="text-editor">
      <LexicalComposer initialConfig={initialConfig}>
        <EditorToolbar />
        <div className="editor-wrapper">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="editor-content" />
            }
            placeholder={
              <div className="editor-placeholder">
                Начните редактировать текст или используйте AI-ассистент...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleChange} />
          <InitialContentPlugin content={initialContent} />
          <SelectionToolbar generationId={generationId} />
        </div>
      </LexicalComposer>
    </div>
  )
}

const editorStyles = `
.text-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-wrapper {
  position: relative;
  flex: 1;
  padding: var(--spacing-32);
}

.editor-content {
  min-height: 500px;
  outline: none;
  font-family: 'Times New Roman', serif;
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text-primary);
}

.editor-placeholder {
  position: absolute;
  top: var(--spacing-32);
  left: var(--spacing-32);
  color: var(--color-text-muted);
  font-size: 16px;
  pointer-events: none;
  user-select: none;
}

.editor-root {
  position: relative;
}

.editor-paragraph {
  margin: 0 0 var(--spacing-16) 0;
  text-align: justify;
}

.editor-text-bold {
  font-weight: 700;
}

.editor-text-italic {
  font-style: italic;
}

.editor-text-underline {
  text-decoration: underline;
}

.editor-heading-h1 {
  font-size: 24px;
  font-weight: 700;
  margin: var(--spacing-32) 0 var(--spacing-16) 0;
  text-align: center;
  text-transform: uppercase;
}

.editor-heading-h2 {
  font-size: 20px;
  font-weight: 700;
  margin: var(--spacing-24) 0 var(--spacing-12) 0;
}

.editor-heading-h3 {
  font-size: 18px;
  font-weight: 700;
  margin: var(--spacing-20) 0 var(--spacing-12) 0;
}

.editor-list-ul,
.editor-list-ol {
  margin: var(--spacing-16) 0;
  padding-left: var(--spacing-32);
}

.editor-list-item {
  margin: var(--spacing-8) 0;
}

.editor-link {
  color: var(--color-accent-base);
  text-decoration: underline;
  cursor: pointer;
}

.editor-link:hover {
  color: var(--color-accent-dark);
}

.editor-code {
  background: var(--color-neutral-10);
  padding: var(--spacing-16);
  border-radius: var(--radius-md);
  font-family: 'Courier New', monospace;
  font-size: 14px;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .editor-wrapper {
    padding: var(--spacing-16);
  }
  
  .editor-content {
    font-size: 14px;
  }
}
`

export default TextEditor

