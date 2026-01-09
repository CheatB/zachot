/**
 * LoginPage
 * Страница входа в систему. 
 * Теперь это расширенная версия UnauthPage с открытым окном авторизации.
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Container, Stack, Button, Card } from '@/ui'
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../auth/authContext'
import { getTelegramLink, checkTelegramAuth } from '@/shared/api/auth'

function LoginPage() {
  const { isAuthenticated, loginFromLanding } = useAuthContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [authLink, setAuthLink] = useState<string | null>(null)
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true) // По умолчанию открыто на странице /login

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current)
    }
  }, [isAuthenticated, navigate])

  const startPolling = (token: string) => {
    pollingInterval.current = setInterval(async () => {
      try {
        const result = await checkTelegramAuth(token)
        if (result.status === 'success' && result.user_id) {
          if (pollingInterval.current) clearInterval(pollingInterval.current)
          loginFromLanding(result.user_id, result.user_id)
          navigate('/')
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000)
  }

  const handleTelegramLogin = async () => {
    setLoading(true)
    try {
      const { link, token } = await getTelegramLink()
      setAuthLink(link)
      window.open(link, '_blank')
      startPolling(token)
    } catch (error) {
      console.error('Failed to get Telegram link:', error)
      alert('Не удалось связаться с Telegram. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
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
                <Button variant="primary" size="lg" className="login-trigger" onClick={() => setIsAuthModalOpen(true)}>
                  Войти в аккаунт
                </Button>
                <Button variant="ghost" size="lg" onClick={() => window.location.href = 'https://zachet.tech'}>
                  Узнать больше о сервисе
                </Button>
              </div>
            </Stack>
          </Card>
        </motion.div>

        {/* Auth Modal */}
        {isAuthModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <Card style={{ padding: '40px', maxWidth: '440px', width: '90%', textAlign: 'center', borderRadius: '24px' }}>
              <Stack gap="xl">
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Вход в сервис</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
                    Выберите удобный способ для продолжения
                  </p>
                </div>

                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleTelegramLogin}
                  loading={loading || !!authLink}
                  style={{ backgroundColor: '#229ED9', border: 'none', height: '56px' }}
                >
                  <span style={{ marginRight: '10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.43 3.14L2.5 10.43C1.21 10.95 1.22 11.67 2.27 11.99L7.13 13.51L18.38 6.42C18.91 5.77 19.4 5.92 19 6.36L9.89 16.4L9.5 21.8C10.03 21.8 10.26 21.56 10.56 21.27L13.11 18.79L18.41 22.71C19.39 23.43 20.09 23.06 20.33 21.89L23.8 3.82C24.16 2.42 23.03 1.6 21.43 3.14Z" fill="currentColor"/>
                    </svg>
                  </span>
                  {authLink ? 'Ожидаю подтверждения...' : 'Войти через Telegram'}
                </Button>

                {authLink && (
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Бот открылся в новой вкладке. Если этого не произошло, <a href={authLink} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent-base)' }}>нажмите здесь</a>.
                  </p>
                )}

                <Button variant="ghost" onClick={() => setIsAuthModalOpen(false)}>
                  Отмена
                </Button>
              </Stack>
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

export default LoginPage
