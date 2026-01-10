/**
 * CheckoutPage
 * Страница оплаты с встроенным виджетом Т-Банка
 * 
 * Использует integration.js для встраивания платёжной формы в iframe.
 * Документация: https://developer.tbank.ru/eacq/intro/developer/setup_js/
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Container, Stack, Button, Card } from '@/ui'
import { initiatePayment } from '@/shared/api/payments'
import { useAuth } from '@/app/auth/useAuth'

// Типы для T-Bank Integration
declare global {
  interface Window {
    PaymentIntegration?: {
      init: (config: TBankInitConfig) => Promise<void>
      openPaymentIframe: (paymentId: string) => void
    }
  }
}

interface TBankInitConfig {
  terminalKey: string
  product: 'eacq'
  features: {
    iframe?: {
      onSuccess?: () => void
      onFail?: () => void
      onClose?: () => void
    }
  }
}

type Period = 'month' | 'quarter' | 'year'

const PLAN_INFO: Record<Period, { name: string; price: number; priceTotal: number; description: string }> = {
  month: {
    name: '1 месяц',
    price: 499,
    priceTotal: 499,
    description: 'Подписка на интернет-сервис "Зачёт" на 1 месяц',
  },
  quarter: {
    name: '3 месяца',
    price: 449,
    priceTotal: 1347,
    description: 'Подписка на интернет-сервис "Зачёт" на 3 месяца',
  },
  year: {
    name: '12 месяцев',
    price: 424,
    priceTotal: 5088,
    description: 'Подписка на интернет-сервис "Зачёт" на 12 месяцев',
  },
}

// Terminal Key (тестовый)
const TERMINAL_KEY = '1768061897408DEMO'

function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  
  const period = (searchParams.get('period') as Period) || 'month'
  const plan = PLAN_INFO[period]
  
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  // Логирование для отладки
  const log = useCallback((message: string, data?: unknown) => {
    console.log(`[CheckoutPage] ${message}`, data || '')
  }, [])

  // Загружаем integration.js
  useEffect(() => {
    if (typeof document === 'undefined') return
    
    log('Loading T-Bank integration.js...')
    
    const existingScript = document.querySelector('script[src*="integrationjs.tbank.ru"]')
    if (existingScript) {
      log('Script already loaded')
      setIsScriptLoaded(true)
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://integrationjs.tbank.ru/integration.js'
    script.async = true
    
    script.onload = () => {
      log('T-Bank script loaded successfully')
      setIsScriptLoaded(true)
    }
    
    script.onerror = () => {
      log('Failed to load T-Bank script')
      setError('Не удалось загрузить платёжный модуль')
      setIsLoading(false)
    }
    
    document.body.appendChild(script)
    
    return () => {
      // Не удаляем скрипт при unmount, он нужен для работы iframe
    }
  }, [log])

  // Инициализируем платёж
  useEffect(() => {
    if (!isAuthenticated) {
      log('User not authenticated, redirecting...')
      navigate('/login')
      return
    }
    
    if (!isScriptLoaded) return
    
    const initPayment = async () => {
      log(`Initiating payment for period: ${period}`)
      setIsLoading(true)
      setError(null)
      
      try {
        // Запрашиваем платёж у backend
        const result = await initiatePayment(period)
        log('Payment initiated:', result)
        
        // Инициализируем T-Bank widget
        if (window.PaymentIntegration) {
          log('Initializing T-Bank widget...')
          
          await window.PaymentIntegration.init({
            terminalKey: TERMINAL_KEY,
            product: 'eacq',
            features: {
              iframe: {
                onSuccess: () => {
                  log('Payment SUCCESS!')
                  navigate('/')
                },
                onFail: () => {
                  log('Payment FAILED')
                  navigate('/billing?status=fail')
                },
                onClose: () => {
                  log('Payment form closed')
                  // Пользователь закрыл форму
                },
              },
            },
          })
          
          log('T-Bank widget initialized')
          setIsLoading(false)
          
          // Открываем iframe с платёжной формой
          // PaymentId приходит от backend, но в виджет нужно передать именно тот ID,
          // который вернул T-Bank API (payment_id, а не order_id)
          // Для упрощения используем редирект на payment_url
          
        } else {
          throw new Error('PaymentIntegration not available')
        }
        
      } catch (err) {
        log('Payment initiation failed:', err)
        setError(err instanceof Error ? err.message : 'Ошибка при инициализации платежа')
        setIsLoading(false)
      }
    }
    
    initPayment()
  }, [isAuthenticated, isScriptLoaded, period, navigate, log])

  // Стили
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'checkout-page-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = pageStyles
    }
  }, [])

  // Обработчик оплаты через редирект
  const handlePayWithRedirect = async () => {
    log('Starting payment with redirect...')
    setIsProcessing(true)
    
    try {
      const result = await initiatePayment(period)
      log('Redirecting to payment URL:', result.payment_url)
      window.location.href = result.payment_url
    } catch (err) {
      log('Payment redirect failed:', err)
      setError(err instanceof Error ? err.message : 'Ошибка при переходе к оплате')
      setIsProcessing(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Container size="sm" className="checkout-container">
      <Stack align="center" gap="2xl" className="checkout-stack">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: motionTokens.easing.out }}
          className="checkout-header"
        >
          <h1 className="checkout-title">Оформление подписки</h1>
          <p className="checkout-subtitle">
            Вы оформляете подписку с автоматическим продлением
          </p>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ width: '100%' }}
        >
          <Card className="checkout-summary-card">
            <div className="checkout-summary">
              <div className="checkout-summary__row">
                <span className="checkout-summary__label">Тариф</span>
                <span className="checkout-summary__value">{plan.name}</span>
              </div>
              <div className="checkout-summary__row">
                <span className="checkout-summary__label">Цена в месяц</span>
                <span className="checkout-summary__value">{plan.price} ₽</span>
              </div>
              <div className="checkout-summary__divider" />
              <div className="checkout-summary__row checkout-summary__row--total">
                <span className="checkout-summary__label">К оплате</span>
                <span className="checkout-summary__value checkout-summary__value--total">
                  {plan.priceTotal} ₽
                </span>
              </div>
              <div className="checkout-summary__note">
                Автопродление каждые {period === 'month' ? '30 дней' : period === 'quarter' ? '3 месяца' : '12 месяцев'}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Payment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ width: '100%' }}
        >
          {isLoading ? (
            <Card className="checkout-loading-card">
              <div className="checkout-loading">
                <div className="checkout-loading__spinner" />
                <p>Загрузка платёжной формы...</p>
              </div>
            </Card>
          ) : error ? (
            <Card className="checkout-error-card">
              <div className="checkout-error">
                <span className="checkout-error__icon">⚠️</span>
                <p className="checkout-error__message">{error}</p>
                <Button variant="primary" onClick={handlePayWithRedirect} loading={isProcessing}>
                  Перейти к оплате
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="checkout-pay-card">
              <div className="checkout-pay">
                <p className="checkout-pay__info">
                  Нажмите кнопку ниже для перехода к защищённой форме оплаты Т-Банка
                </p>
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handlePayWithRedirect}
                  loading={isProcessing}
                  className="checkout-pay__button"
                >
                  Оплатить {plan.priceTotal} ₽
                </Button>
                <div className="checkout-pay__security">
                  <span>🔒</span>
                  <span>Безопасная оплата через Т-Банк</span>
                </div>
              </div>
            </Card>
          )}
        </motion.div>

        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/billing')}>
          ← Вернуться к выбору тарифа
        </Button>

      </Stack>
    </Container>
  )
}

const pageStyles = `
.checkout-container {
  padding-top: var(--spacing-48);
  padding-bottom: var(--spacing-80);
}

.checkout-stack {
  max-width: 480px;
  margin: 0 auto;
}

.checkout-header {
  text-align: center;
}

.checkout-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--color-neutral-110);
  margin-bottom: 12px;
  letter-spacing: -0.03em;
}

.checkout-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.checkout-summary-card {
  padding: 24px !important;
}

.checkout-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkout-summary__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkout-summary__label {
  font-size: 15px;
  color: var(--color-text-secondary);
}

.checkout-summary__value {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.checkout-summary__divider {
  height: 1px;
  background: var(--color-border-light);
  margin: 8px 0;
}

.checkout-summary__row--total {
  padding-top: 8px;
}

.checkout-summary__value--total {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-accent-base);
}

.checkout-summary__note {
  font-size: 13px;
  color: var(--color-text-muted);
  text-align: center;
  margin-top: 8px;
}

.checkout-loading-card,
.checkout-error-card,
.checkout-pay-card {
  padding: 32px !important;
}

.checkout-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--color-text-secondary);
}

.checkout-loading__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-neutral-20);
  border-top-color: var(--color-accent-base);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.checkout-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.checkout-error__icon {
  font-size: 48px;
}

.checkout-error__message {
  color: var(--color-danger-base);
  font-size: 15px;
}

.checkout-pay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.checkout-pay__info {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.checkout-pay__button {
  width: 100%;
  height: 56px !important;
  font-size: 18px !important;
  border-radius: 14px !important;
}

.checkout-pay__security {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}

/* Mobile */
@media (max-width: 640px) {
  .checkout-container {
    padding-top: var(--spacing-24);
    padding-bottom: var(--spacing-48);
  }
  
  .checkout-title {
    font-size: 24px;
  }
  
  .checkout-subtitle {
    font-size: 14px;
  }
  
  .checkout-summary-card,
  .checkout-loading-card,
  .checkout-error-card,
  .checkout-pay-card {
    padding: 20px !important;
  }
  
  .checkout-summary__value--total {
    font-size: 20px;
  }
  
  .checkout-pay__button {
    height: 52px !important;
    font-size: 16px !important;
  }
}
`

export default CheckoutPage

