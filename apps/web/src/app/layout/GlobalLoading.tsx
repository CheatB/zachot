/**
 * GlobalLoading component
 * Глобальный loading overlay при смене маршрутов
 */

import { motion, AnimatePresence } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'

interface GlobalLoadingProps {
  isLoading: boolean
}

function GlobalLoading({ isLoading }: GlobalLoadingProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="global-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: motionTokens.duration.fast,
            ease: motionTokens.easing.out,
          }}
          aria-live="polite"
          aria-label="Загрузка"
        >
          <div className="global-loading__spinner">
            <div className="global-loading__spinner-circle" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GlobalLoading

const loadingStyles = `
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-surface-overlay);
  backdrop-filter: blur(2px);
  z-index: var(--z-index-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.global-loading__spinner {
  width: 48px;
  height: 48px;
  position: relative;
}

.global-loading__spinner-circle {
  width: 100%;
  height: 100%;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-accent-base);
  border-radius: var(--radius-full);
  animation: global-loading-spin 0.8s linear infinite;
}

@keyframes global-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'global-loading-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = loadingStyles
    document.head.appendChild(style)
  }
}


