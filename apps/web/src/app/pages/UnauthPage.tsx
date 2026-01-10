/**
 * UnauthPage
 * Приветственная страница для неавторизованных пользователей
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Container, Stack, Button, Card } from '@/ui'
import { useEffect, useState } from 'react'

function UnauthPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

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

  const handleLoginClick = () => {
    // Теперь кнопка открывает модальное окно (реализация окна будет следующим шагом)
    setIsAuthModalOpen(true)
    // Временно для теста можно оставить переход, если нужно, 
    // но по ТЗ кнопка должна вызывать окошко.
    console.log('Open Auth Modal')
  }

  const features = [
    { text: 'Мы напишем твою работу по ГОСТу' },
    { text: 'Поможем собрать классную презентацию' },
    { text: 'Научим решать задачи любой сложности' },
  ]

  return (
    <Container size="full">
      <Stack align="center" gap="3xl" style={{ paddingTop: '10vh', paddingBottom: 'var(--spacing-80)' }}>
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: motionTokens.easing.out }}
          style={{ textAlign: 'center', maxWidth: '800px' }}
        >
          <h1 className="unauth-title">Передай нам свою рутину</h1>
          <p className="unauth-subtitle">
            Для доступа к вашим работам и инструментам пожалуйста войдите в личный кабинет.
          </p>
        </motion.div>

        {/* Teaser Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ width: '100%', maxWidth: '600px' }}
        >
          <Card className="unauth-card">
            <Stack gap="xl">
              <div className="unauth-features">
                {features.map((f, i) => (
                  <div key={i} className="unauth-feature">
                    <span className="unauth-feature__text">{f.text}</span>
                  </div>
                ))}
              </div>

              <div className="unauth-actions">
                <Button variant="primary" size="lg" className="login-trigger" onClick={handleLoginClick}>
                  Войти в аккаунт
                </Button>
                <Button variant="ghost" size="lg" onClick={() => window.location.href = 'https://zachet.tech'}>
                  Узнать больше о сервисе
                </Button>
              </div>
            </Stack>
          </Card>
        </motion.div>

        {/* Placeholder for Auth Modal */}
        {isAuthModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <Card style={{ padding: '40px', maxWidth: '400px', textAlign: 'center' }}>
              <h3>Авторизация</h3>
              <p>Окно выбора способа входа будет реализовано следующим шагом.</p>
              <Button onClick={() => setIsAuthModalOpen(false)} style={{ marginTop: '20px' }}>Закрыть</Button>
            </Card>
          </div>
        )}

      </Stack>

      <style>{pageStyles}</style>
    </Container>
  )
}

const pageStyles = `
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
  max-width: 500px;
  margin: 0 auto;
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
  gap: 12px;
  margin-bottom: 8px;
}

.unauth-feature {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background-color: var(--color-neutral-10);
  border-radius: 12px;
  text-align: center;
}

.unauth-feature__text {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-neutral-90);
  white-space: nowrap;
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
  .unauth-feature__text {
    white-space: normal;
  }
}
`

export default UnauthPage
