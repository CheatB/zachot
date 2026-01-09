/**
 * UnauthPage
 * Приветственная страница для неавторизованных пользователей
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Container, Stack, Button, Card } from '@/ui'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function UnauthPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'unauth-page-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = pageStyles
    }
  }, [])

  const handleLogin = () => {
    navigate('/login')
  }

  const features = [
    { icon: '📝', text: 'Генерация текстов по ГОСТу' },
    { icon: '📊', text: 'Создание презентаций за 1 минуту' },
    { icon: '🧠', text: 'Решение задач любого уровня' },
  ]

  return (
    <Container size="full">
      <Stack align="center" gap="3xl" style={{ paddingTop: '10vh', paddingBottom: 'var(--spacing-80)' }}>
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: motionTokens.easing.out }}
          style={{ textAlign: 'center', maxWidth: '600px' }}
        >
          <div className="unauth-badge">Доступ ограничен</div>
          <h1 className="unauth-title">Вернитесь к учёбе без рутины</h1>
          <p className="unauth-subtitle">
            Для доступа к вашим работам и инструментам генерации необходимо войти в личный кабинет.
          </p>
        </motion.div>

        {/* Teaser Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ width: '100%', maxWidth: '500px' }}
        >
          <Card className="unauth-card">
            <Stack gap="xl">
              <div className="unauth-features">
                {features.map((f, i) => (
                  <div key={i} className="unauth-feature">
                    <span className="unauth-feature__icon">{f.icon}</span>
                    <span className="unauth-feature__text">{f.text}</span>
                  </div>
                ))}
              </div>

              <div className="unauth-actions">
                <Button variant="primary" size="lg" className="login-trigger" onClick={handleLogin}>
                  Войти в аккаунт
                </Button>
                <Button variant="ghost" size="lg" onClick={() => window.location.href = 'https://zachet.tech'}>
                  Узнать больше о сервисе
                </Button>
              </div>
            </Stack>
          </Card>
        </motion.div>

      </Stack>

      <style>{pageStyles}</style>
    </Container>
  )
}

const pageStyles = `
.unauth-badge {
  display: inline-block;
  padding: 6px 16px;
  background-color: var(--color-neutral-10);
  color: var(--color-text-muted);
  border-radius: 99px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 24px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.unauth-title {
  font-size: 48px;
  font-weight: 800;
  color: var(--color-neutral-110);
  margin-bottom: 24px;
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.unauth-subtitle {
  font-size: 18px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.unauth-card {
  padding: 40px !important;
  border-radius: 28px !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05) !important;
  border: 1px solid var(--color-border-light) !important;
  background: white !important;
}

.unauth-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 8px;
}

.unauth-feature {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background-color: var(--color-neutral-10);
  border-radius: 12px;
}

.unauth-feature__icon {
  font-size: 20px;
}

.unauth-feature__text {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-neutral-90);
}

.unauth-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-trigger {
  height: 56px !important;
  font-size: 16px !important;
  font-weight: 700 !important;
}

@media (max-width: 640px) {
  .unauth-title {
    font-size: 32px;
  }
}
`

export default UnauthPage
