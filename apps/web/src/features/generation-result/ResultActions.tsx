/**
 * ResultActions component
 * Действия с результатом генерации
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Button, Stack, Tooltip } from '@/ui'

interface ResultActionsProps {
  onCopy: () => void
  onNewGeneration: () => void
  onBackToList: () => void
  onExport: (format: 'docx' | 'pdf' | 'pptx') => void
  isDegraded?: boolean
  onContinue?: () => void
}

function ResultActions({
  onCopy,
  onNewGeneration,
  onBackToList,
  onExport,
}: ResultActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      className="result-actions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
        delay: 0.2,
      }}
    >
      <Stack gap="lg">
        <div className="result-actions__primary">
          <Button variant="primary" onClick={handleCopy}>
            {copied ? '✅ Скопировано' : '📋 Скопировать текст'}
          </Button>
          <Button variant="secondary" onClick={onNewGeneration}>
            ✨ Новая работа
          </Button>
        </div>

        <div className="result-actions__export">
          <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-12)' }}>
            Экспорт файла по ГОСТу
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-12)', flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={() => onExport('docx')}>📄 .DOCX</Button>
            <Button variant="ghost" size="sm" onClick={() => onExport('pdf')}>📕 .PDF</Button>
            <Tooltip content="Доступно для презентаций">
              <Button variant="ghost" size="sm" onClick={() => onExport('pptx')} disabled>📊 .PPTX</Button>
            </Tooltip>
          </div>
        </div>

        <div className="result-actions__secondary">
          <Button variant="ghost" onClick={onBackToList}>
            ← Вернуться к списку
          </Button>
        </div>
      </Stack>
    </motion.div>
  )
}

export default ResultActions

const actionsStyles = `
.result-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
  padding-top: var(--spacing-24);
  border-top: 1px solid var(--color-border-light);
}

.result-actions__primary {
  display: flex;
  gap: var(--spacing-16);
  flex-wrap: wrap;
}

.result-actions__export {
  padding: var(--spacing-16);
  background-color: var(--color-neutral-10);
  border-radius: var(--radius-md);
}

.result-actions__secondary {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 768px) {
  .result-actions__primary {
    flex-direction: column;
  }
  
  .result-actions__primary button {
    width: 100%;
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'result-actions-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = actionsStyles
    document.head.appendChild(style)
  }
}
