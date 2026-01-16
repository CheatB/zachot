/**
 * DownloadModal
 * Модальное окно для скачивания готовых документов
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/ui'
import { API_BASE_URL } from '@/shared/config'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  generationId: string
}

function DownloadModal({ isOpen, onClose, generationId }: DownloadModalProps) {
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (format: 'docx' | 'pdf') => {
    setDownloading(format)
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/api/generations/${generationId}/export/${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zachet_${generationId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert(`Не удалось скачать файл. Попробуйте еще раз.`)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="download-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="download-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="download-modal__header">
              <h2 className="download-modal__title">Готово!</h2>
              <button 
                className="download-modal__close" 
                onClick={onClose}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>

            <div className="download-modal__content">
              <p className="download-modal__description">
                Ваша работа готова к скачиванию. Выберите формат:
              </p>

              <div className="download-modal__buttons">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleDownload('docx')}
                  disabled={downloading !== null}
                  style={{ width: '100%' }}
                >
                  {downloading === 'docx' ? '⏳ Скачивание...' : '📄 Скачать .DOCX'}
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => handleDownload('pdf')}
                  disabled={downloading !== null}
                  style={{ width: '100%' }}
                >
                  {downloading === 'pdf' ? '⏳ Скачивание...' : '📕 Скачать .PDF'}
                </Button>
              </div>

              <p className="download-modal__hint">
                Документ отформатирован по выбранным настройкам ГОСТ
              </p>
            </div>
          </motion.div>

          <style>{modalStyles}</style>
        </>
      )}
    </AnimatePresence>
  )
}

const modalStyles = `
.download-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9998;
}

.download-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  z-index: 9999;
  overflow: hidden;
}

.download-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-24) var(--spacing-32);
  border-bottom: 1px solid var(--color-border-light);
}

.download-modal__title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-neutral-110);
  margin: 0;
}

.download-modal__close {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-neutral-20);
  border-radius: var(--radius-full);
  color: var(--color-neutral-70);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.download-modal__close:hover {
  background: var(--color-neutral-30);
  color: var(--color-neutral-100);
}

.download-modal__content {
  padding: var(--spacing-32);
}

.download-modal__description {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-24) 0;
  line-height: 1.5;
}

.download-modal__buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
  margin-bottom: var(--spacing-20);
}

.download-modal__hint {
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: center;
  margin: 0;
  padding: var(--spacing-16);
  background: var(--color-accent-light);
  border-radius: var(--radius-md);
}

@media (max-width: 768px) {
  .download-modal {
    max-width: 95%;
  }
  
  .download-modal__header {
    padding: var(--spacing-20) var(--spacing-24);
  }
  
  .download-modal__content {
    padding: var(--spacing-24);
  }
  
  .download-modal__title {
    font-size: 20px;
  }
}
`

export default DownloadModal
