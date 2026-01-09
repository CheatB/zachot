/**
 * SmartEditor component
 * Интерактивный редактор текста с AI-функциями
 */

import { useState } from 'react'
import { Card, Button, Stack } from '@/ui'
import { motion, AnimatePresence } from 'framer-motion'

interface SmartEditorProps {
  content: string
  onContentChange: (newContent: string) => void
}

function SmartEditor({ content, onContentChange }: SmartEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedParagraph, setSelectedParagraph] = useState<number | null>(null)

  const paragraphs = content.split('\n\n')

  const handleRewrite = (index: number, style: string) => {
    // Mock rewrite
    console.log(`Rewriting paragraph ${index} in style ${style}`)
    // В реальности здесь был бы API call
  }

  return (
    <Card className="smart-editor-card">
      <div className="smart-editor">
        <div className="smart-editor__toolbar">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '💾 Сохранить' : '✍️ Редактировать'}
          </Button>
        </div>

        <div className="smart-editor__content">
          {isEditing ? (
            <textarea
              className="smart-editor__textarea"
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              rows={20}
            />
          ) : (
            <Stack gap="md">
              {paragraphs.map((text, index) => (
                <div 
                  key={index}
                  className={`smart-editor__paragraph ${selectedParagraph === index ? 'smart-editor__paragraph--selected' : ''}`}
                  onClick={() => setSelectedParagraph(index)}
                >
                  <p>{text}</p>
                  
                  <AnimatePresence>
                    {selectedParagraph === index && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="smart-editor__paragraph-actions"
                      >
                        <Stack direction="row" gap="xs">
                          <Button variant="ghost" size="sm" onClick={() => handleRewrite(index, 'simpler')}>Проще</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRewrite(index, 'academic')}>Академичнее</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRewrite(index, 'shorter')}>Короче</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRewrite(index, 'less-ai')}>Менее ИИ</Button>
                        </Stack>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </Stack>
          )}
        </div>
      </div>
    </Card>
  )
}

export default SmartEditor

const editorStyles = `
.smart-editor-card {
  max-height: 800px;
  overflow-y: auto;
}

.smart-editor {
  padding: var(--spacing-24);
}

.smart-editor__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-16);
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: var(--spacing-12);
}

.smart-editor__textarea {
  width: 100%;
  border: none;
  background: transparent;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-primary);
  outline: none;
  resize: vertical;
}

.smart-editor__paragraph {
  position: relative;
  padding: var(--spacing-8);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.smart-editor__paragraph:hover {
  background-color: var(--color-neutral-10);
}

.smart-editor__paragraph--selected {
  background-color: var(--color-accent-light);
}

.smart-editor__paragraph-actions {
  margin-top: var(--spacing-12);
  padding-top: var(--spacing-12);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'smart-editor-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = editorStyles
    document.head.appendChild(style)
  }
}

