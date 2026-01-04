/**
 * ResultContent component
 * Отображение результата генерации (readable output)
 */

import { motion, useReducedMotion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card } from '@/ui'

interface ResultContentProps {
  content: string
  type: 'text' | 'presentation' | 'task'
}

function ResultContent({ content }: ResultContentProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
      }}
    >
      <Card className="result-content-card">
        <div
          className="result-content"
          style={{
            fontFamily: 'var(--font-family-sans)',
            fontSize: 'var(--font-size-base)',
            lineHeight: 'var(--line-height-relaxed)',
            color: 'var(--color-text-primary)',
          }}
        >
          {content.split('\n\n').map((paragraph, index) => {
            if (paragraph.trim() === '') return null

            // Определяем тип параграфа
            if (paragraph.startsWith('# ')) {
              return (
                <h2
                  key={index}
                  style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text-primary)',
                    marginTop: index > 0 ? 'var(--spacing-32)' : '0',
                    marginBottom: 'var(--spacing-12)',
                    lineHeight: 'var(--line-height-tight)',
                  }}
                >
                  {paragraph.replace('# ', '')}
                </h2>
              )
            }

            if (paragraph.startsWith('## ')) {
              return (
                <h3
                  key={index}
                  style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                    marginTop: index > 0 ? 'var(--spacing-24)' : '0',
                    marginBottom: 'var(--spacing-12)',
                    lineHeight: 'var(--line-height-tight)',
                  }}
                >
                  {paragraph.replace('## ', '')}
                </h3>
              )
            }

            if (paragraph.startsWith('- ')) {
              const items = paragraph.split('\n').filter((line) => line.startsWith('- '))
              return (
                <ul
                  key={index}
                  style={{
                    marginTop: index > 0 ? 'var(--spacing-16)' : '0',
                    marginBottom: 'var(--spacing-16)',
                    paddingLeft: 'var(--spacing-24)',
                    listStyle: 'disc',
                  }}
                >
                  {items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      style={{
                        marginBottom: 'var(--spacing-8)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {item.replace('- ', '')}
                    </li>
                  ))}
                </ul>
              )
            }

            return (
              <p
                key={index}
                style={{
                  marginTop: index > 0 ? 'var(--spacing-16)' : '0',
                  marginBottom: 'var(--spacing-16)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {paragraph}
              </p>
            )
          })}
        </div>
      </Card>
    </motion.div>
  )
}

export default ResultContent

const contentStyles = `
.result-content-card {
  max-height: 600px;
  overflow-y: auto;
}

.result-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.result-content::-webkit-scrollbar {
  width: 8px;
}

.result-content::-webkit-scrollbar-track {
  background: var(--color-neutral-20);
  border-radius: var(--radius-md);
}

.result-content::-webkit-scrollbar-thumb {
  background: var(--color-border-base);
  border-radius: var(--radius-md);
}

.result-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-dark);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'result-content-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = contentStyles
    document.head.appendChild(style)
  }
}

