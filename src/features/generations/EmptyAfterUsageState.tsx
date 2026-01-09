/**
 * EmptyAfterUsageState component
 * Empty state когда были генерации, но сейчас нет
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Button, EmptyState } from '@/ui'

interface EmptyAfterUsageStateProps {
  onCreateNew: () => void
}

function EmptyAfterUsageState({ onCreateNew }: EmptyAfterUsageStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
      }}
      className="empty-after-usage"
    >
      <EmptyState
        title="Пока здесь пусто"
        description="Вы можете создать новую генерацию в любой момент"
      >
        <div className="empty-after-usage__action">
          <Button variant="primary" onClick={onCreateNew}>
            Новая генерация
          </Button>
        </div>
      </EmptyState>
    </motion.div>
  )
}

export default EmptyAfterUsageState

const emptyAfterUsageStyles = `
.empty-after-usage {
  width: 100%;
}

.empty-after-usage__action {
  margin-top: var(--spacing-24);
  display: flex;
  justify-content: center;
}
`

if (typeof document !== 'undefined') {
  const styleId = 'empty-after-usage-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = emptyAfterUsageStyles
    document.head.appendChild(style)
  }
}


