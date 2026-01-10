/**
 * NotFoundPage
 * Страница 404 в стиле лендинга
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Container, Stack, Button } from '@/ui'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

function NotFoundPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'not-found-page-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = pageStyles
    }
  }, [])

  return (
    <Container size="full">
      <Stack align="center" gap="3xl" style={{ paddingTop: '15vh', paddingBottom: 'var(--spacing-80)' }}>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: motionTokens.easing.out }}
          style={{ textAlign: 'center', maxWidth: '600px' }}
        >
          <div className="error-code">404</div>
          <h1 className="error-title">Страница не найдена</h1>
          <p className="error-subtitle">
            Похоже, эта страница ушла на каникулы или её никогда не существовало.
          </p>
          
          <div style={{ marginTop: '40px' }}>
            <Button variant="primary" size="lg" onClick={() => navigate('/')}>
              Вернуться на главную
            </Button>
          </div>
        </motion.div>

      </Stack>

      <style>{pageStyles}</style>
    </Container>
  )
}

const pageStyles = `
.error-code {
  font-size: 120px;
  font-weight: 900;
  color: var(--color-accent-base);
  line-height: 1;
  margin-bottom: 16px;
  letter-spacing: -0.05em;
  opacity: 0.2;
}

.error-title {
  font-size: 48px;
  font-weight: 800;
  color: var(--color-neutral-110);
  margin-bottom: 24px;
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.error-subtitle {
  font-size: 18px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  max-width: 460px;
  margin: 0 auto;
}

@media (max-width: 640px) {
  .error-code {
    font-size: 80px;
  }
  .error-title {
    font-size: 32px;
  }
}
`

export default NotFoundPage

