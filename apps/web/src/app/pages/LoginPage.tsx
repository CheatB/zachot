/**
 * LoginPage
 * Страница входа в систему. 
 * Теперь это расширенная версия UnauthPage с открытым окном авторизации.
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Container, Stack, Button, Card, Input } from '@/ui'
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../auth/authContext'
import { getTelegramLink, checkTelegramAuth, emailLogin } from '@/shared/api/auth'

type AuthView = 'main' | 'email'

function LoginPage() {
  const { isAuthenticated, loginFromLanding } = useAuthContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [authLink, setAuthLink] = useState<string | null>(null)
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [view, setView] = useState<AuthView>('main')
  
  // Email form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    
    setLoading(true)
    setError(null)
    try {
      const result = await emailLogin(email, password)
      loginFromLanding(result.token, result.user_id)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { text: 'Мы напишем твою работу по ГОСТу' },
    { text: 'Поможем собрать классную презентацию' },
    { text: 'Научим решать задачи любой сложности' },
  ]

  const handleOpenModal = () => {
    setView('main')
    setIsAuthModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsAuthModalOpen(false)
    setView('main')
    setError(null)
  }

  return (
    <Container size="full">
      <Stack align="center" gap="3xl" style={{ paddingTop: '10vh', paddingBottom: 'var(--spacing-80)' }}>
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: motionTokens.easing.out }}
          style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '15px' }}
        >
          <h1 className="unauth-title">Передай нам свою рутину и живи спокойно</h1>
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
                    <span className="unauth-feature__bullet">•</span>
                    <span className="unauth-feature__text">{f.text}</span>
                  </div>
                ))}
              </div>

              <div className="unauth-actions">
                <Button variant="primary" size="lg" className="login-trigger" onClick={handleOpenModal}>
                  Войти в аккаунт
                </Button>
                <Button variant="primary" size="lg" className="login-trigger" onClick={() => window.location.href = 'https://zachet.tech'}>
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
              
              {view === 'main' ? (
                <Stack gap="xl">
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Вход в сервис</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
                      Выберите удобный способ для продолжения
                    </p>
                  </div>

                  <Stack gap="md" style={{ gap: '26px' }}>
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

                    <Button 
                      variant="secondary" 
                      size="lg" 
                      onClick={() => setView('email')}
                      style={{ height: '56px' }}
                    >
                      ✉️ Войти через e-mail
                    </Button>
                  </Stack>

                  {authLink && (
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Бот открылся в новой вкладке. Если этого не произошло, <a href={authLink} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent-base)' }}>нажмите здесь</a>.
                    </p>
                  )}

                  <Button variant="ghost" onClick={handleCloseModal} style={{ marginTop: '25px' }}>
                    Отмена
                  </Button>
                </Stack>
              ) : (
                <form onSubmit={handleEmailLogin}>
                  <Stack gap="xl">
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Вход по e-mail</h3>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
                        Введите вашу почту и пароль
                      </p>
                    </div>

                    <Stack gap="md" style={{ gap: '26px' }}>
                      <Input 
                        type="email" 
                        placeholder="your@email.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="Ваш пароль" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        suffix={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-text-muted)'
                            }}
                            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                          >
                            {showPassword ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            )}
                          </button>
                        }
                      />
                    </Stack>

                    {error && (
                      <p style={{ color: 'var(--color-danger-base)', fontSize: '14px' }}>{error}</p>
                    )}

                    <Stack gap="sm" style={{ gap: '23px', marginTop: '15px' }}>
                      <Button 
                        type="submit"
                        variant="primary" 
                        size="lg" 
                        loading={loading}
                        style={{ height: '56px' }}
                      >
                        Войти / Создать аккаунт
                      </Button>
                      <Button variant="ghost" onClick={() => setView('main')}>
                        Назад
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              )}
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
  gap: 16px;
  margin-bottom: 28px;
}

.unauth-feature {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.unauth-feature__bullet {
  color: var(--color-accent-base);
  font-weight: bold;
  font-size: 20px;
}

.unauth-feature__text {
  font-size: 16px;
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

export default LoginPage
