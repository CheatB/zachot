/**
 * ResultActions component
 * Действия с результатом генерации
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Button } from '@/ui'

interface ResultActionsProps {
  onCopy: () => void
  onNewGeneration: () => void
  onBackToList: () => void
  isDegraded?: boolean
  onContinue?: () => void
}

function ResultActions({
  onCopy,
  onNewGeneration,
  onBackToList,
  isDegraded = false,
  onContinue,
}: ResultActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Degraded state actions
  if (isDegraded) {
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
        <div className="result-actions__primary">
          <Button variant="primary" onClick={onNewGeneration}>
            Создать новую генерацию
          </Button>
          {onContinue && (
            <Button variant="secondary" onClick={onContinue}>
              Продолжить с этим результатом
            </Button>
          )}
        </div>
        <div className="result-actions__secondary">
          <Button variant="ghost" onClick={onBackToList}>
            Вернуться к списку
          </Button>
        </div>
      </motion.div>
    )
  }

  // Normal state actions
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
      <div className="result-actions__primary">
        <Button variant="primary" onClick={handleCopy}>
          {copied ? 'Скопировано' : 'Скопировать результат'}
        </Button>
        <Button variant="secondary" onClick={onNewGeneration}>
          Создать новую генерацию
        </Button>
      </div>
      <div className="result-actions__secondary">
        <Button variant="ghost" onClick={onBackToList}>
          Вернуться к списку
        </Button>
      </div>
    </motion.div>
  )
}

export default ResultActions

const actionsStyles = `
.result-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
}

.result-actions__primary {
  display: flex;
  gap: var(--spacing-16);
  flex-wrap: wrap;
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

