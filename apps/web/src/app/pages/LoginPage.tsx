/**
 * LoginPage
 * Страница входа в систему
 * Реализована в дизайн-коде сервиса с поддержкой авторизации через Telegram
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
  const pollingInterval = useRef<any>(null)

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
          // В MVP токен — это ID пользователя
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

  return (
    <Container size="sm">
      <Stack align="center" gap="3xl" style={{ paddingTop: '15vh', paddingBottom: 'var(--spacing-80)' }}>
        
        {/* Logo & Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: motionTokens.easing.out }}
          style={{ textAlign: 'center' }}
        >
          <div className="login-logo">
            <div className="login-logo__icon">
              <svg width="24" height="18" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 7.5L6 12.5L17 1.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="login-logo__text">Зачёт</span>
          </div>
          
          <h1 className="login-title">Добро пожаловать</h1>
          <p className="login-subtitle">
            Войдите, чтобы сохранять свои работы и получать доступ к полному функционалу сервиса
          </p>
        </motion.div>

        {/* Login Options */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ width: '100%' }}
        >
          <Card className="login-card">
            <Stack gap="xl">
              <div className="login-card__method">
                <div className="login-card__method-title">Авторизация через мессенджер</div>
                <p className="login-card__method-desc">
                  Самый быстрый и безопасный способ входа без пароля
                </p>
                
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="telegram-btn"
                  onClick={handleTelegramLogin}
                  loading={loading || !!authLink}
                >
                  <span className="telegram-btn__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.43 3.14L2.5 10.43C1.21 10.95 1.22 11.67 2.27 11.99L7.13 13.51L18.38 6.42C18.91 5.77 19.4 5.92 19 6.36L9.89 16.4L9.5 21.8C10.03 21.8 10.26 21.56 10.56 21.27L13.11 18.79L18.41 22.71C19.39 23.43 20.09 23.06 20.33 21.89L23.8 3.82C24.16 2.42 23.03 1.6 21.43 3.14Z" fill="currentColor"/>
                    </svg>
                  </span>
                  {authLink ? 'Ожидаю подтверждения...' : 'Войти через Telegram'}
                </Button>
                
                {authLink && (
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '12px', textAlign: 'center' }}>
                    Бот открылся в новой вкладке. Нажмите «Запустить» в Telegram.
                  </p>
                )}
              </div>

              <div className="login-divider">
                <span>или</span>
              </div>

              <div className="login-card__footer">
                <p>
                  Используя сервис, вы соглашаетесь с <a href="/terms">условиями использования</a>
                </p>
              </div>
            </Stack>
          </Card>
        </motion.div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <a href="https://zachet.tech" className="back-link">
            ← Вернуться на главную
          </a>
        </motion.div>

      </Stack>

      <style>{loginStyles}</style>
    </Container>
  )
}

const loginStyles = `
.login-logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.login-logo__icon {
  width: 40px;
  height: 40px;
  background-color: var(--color-neutral-110);
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-logo__text {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-neutral-110);
  letter-spacing: -0.02em;
}

.login-title {
  font-size: 36px;
  font-weight: 800;
  color: var(--color-neutral-110);
  margin-bottom: 16px;
  letter-spacing: -0.04em;
}

.login-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  max-width: 400px;
  margin: 0 auto;
  line-height: 1.5;
}

.login-card {
  padding: 48px !important;
  border-radius: 28px !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05) !important;
  border: 1px solid var(--color-border-light) !important;
}

.login-card__method-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-neutral-110);
  margin-bottom: 8px;
  text-align: center;
}

.login-card__method-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 32px;
  text-align: center;
}

.telegram-btn {
  width: 100%;
  height: 56px;
  background-color: #229ED9 !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 16px !important;
  border-radius: 14px !important;
  display: flex !important;
  gap: 12px !important;
  border: none !important;
  box-shadow: 0 4px 15px rgba(34, 158, 217, 0.3) !important;
}

.telegram-btn:hover {
  background-color: #1c8cc3 !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 158, 217, 0.4) !important;
}

.telegram-btn__icon {
  display: flex;
  align-items: center;
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--color-text-disabled);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.login-divider::before,
.login-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background-color: var(--color-border-light);
}

.login-card__footer {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
}

.login-card__footer a {
  color: var(--color-accent-base);
  text-decoration: underline;
}

.back-link {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--color-neutral-110);
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px !important;
  }
  .login-title {
    font-size: 28px;
  }
}
`

export default LoginPage
