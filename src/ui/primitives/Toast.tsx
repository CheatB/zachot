/**
 * Toast component
 * Simple notification system
 */

/* eslint-disable react-refresh/only-export-components */
import { useState, createContext, useContext, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: string
  text: string
  type: ToastType
}

interface ToastContextType {
  showToast: (text: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((text: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`toast toast--${toast.type}`}
            >
              {toast.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

const styles = `
.toast-container {
  position: fixed;
  bottom: var(--spacing-32);
  right: var(--spacing-32);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
  z-index: 9999;
}

.toast {
  padding: var(--spacing-12) var(--spacing-24);
  border-radius: var(--radius-md);
  background-color: var(--color-neutral-110);
  color: var(--color-text-inverse);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  box-shadow: var(--elevation-3);
}

.toast--success { background-color: var(--color-success-base); }
.toast--error { background-color: var(--color-danger-base); }
.toast--info { background-color: var(--color-neutral-100); }
`

if (typeof document !== 'undefined') {
  const styleId = 'ui-toast-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = styles
    document.head.appendChild(style)
  }
}

