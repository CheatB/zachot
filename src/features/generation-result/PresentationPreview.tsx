/**
 * PresentationPreview
 * Мини-галерея слайдов для предпросмотра результата
 */

import { Card } from '@/ui'
import { motion } from 'framer-motion'

interface PresentationPreviewProps {
  content: string
  style: string
}

function PresentationPreview({ content }: PresentationPreviewProps) {
  const slides = content.split('## ').filter(s => s.trim().length > 0)

  return (
    <div className="presentation-preview">
      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-16)' }}>
        Предпросмотр слайдов
      </h3>
      <div className="slides-grid">
        {slides.map((slide, index) => {
          const [title, ...text] = slide.split('\n')
          return (
            <motion.div 
              key={index}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card style={{ 
                aspectRatio: '16/9', 
                padding: 'var(--spacing-12)', 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: 'var(--color-surface-base)',
                border: '1px solid var(--color-border-light)',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  fontSize: '0.6rem', 
                  fontWeight: 'bold', 
                  color: 'var(--color-accent-base)',
                  marginBottom: 'var(--spacing-4)',
                  borderBottom: '1px solid var(--color-border-light)',
                  paddingBottom: 2
                }}>
                  {title}
                </div>
                <div style={{ 
                  fontSize: '0.4rem', 
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.4
                }}>
                  {text.join(' ').substring(0, 150)}...
                </div>
                <div style={{ marginTop: 'auto', textAlign: 'right', fontSize: '0.4rem', color: 'var(--color-text-muted)' }}>
                  {index + 1}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default PresentationPreview

const styles = `
.slides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-16);
  margin-bottom: var(--spacing-32);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'presentation-preview-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = styles
    document.head.appendChild(style)
  }
}

