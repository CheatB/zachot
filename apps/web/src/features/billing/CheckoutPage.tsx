/**
 * CheckoutPage
 * Страница оплаты
 * 
 * Использует прямой редирект на платежную форму для максимальной надежности.
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Stack, Button } from '@/ui'
import { initiatePayment } from '@/shared/api/payments'
import { useAuth } from '@/app/auth/useAuth'

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

function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isAuthResolved } = useAuth()
  
  const period = (searchParams.get('period') as Period) || 'month'
  const plan = PLAN_INFO[period]
  
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Логирование для отладки
  const log = useCallback((message: string, data?: unknown) => {
    console.log(`[CheckoutPage] ${message}`, data || '')
  }, [])

  // Обработчик оплаты через редирект
  const handlePayWithRedirect = useCallback(async () => {
    log('Starting payment with redirect...')
    setIsProcessing(true)
    setError(null)
    
    try {
      const result = await initiatePayment(period)
      log('Redirecting to payment URL:', result.payment_url)
      window.location.href = result.payment_url
    } catch (err) {
      log('Payment redirect failed:', err)
      setError(err instanceof Error ? err.message : 'Ошибка при переходе к оплате')
      setIsProcessing(false)
    }
  }, [period, log])

  // Инициализируем платёж
  useEffect(() => {
    if (!isAuthResolved) return

    if (!isAuthenticated) {
      log('User not authenticated, redirecting to login...')
      const currentUrl = window.location.pathname + window.location.search
      const nextUrl = encodeURIComponent(currentUrl)
      navigate(`/login?next=${nextUrl}`)
      return
    }
    
    setIsLoading(false)
  }, [isAuthenticated, isAuthResolved, navigate, log])

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

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="checkout-page">
      <div className="checkout-back-nav">
        <Button variant="ghost" onClick={() => navigate('/billing')} className="checkout-back-button">
          ← Назад к тарифам
        </Button>
      </div>

      <div className="checkout-content">
        <Stack align="center" gap="2xl" className="checkout-stack">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: motionTokens.easing.out }}
            className="checkout-header"
          >
            <h1 className="checkout-title">Оформление подписки</h1>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ width: '100%' }}
          >
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
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ width: '100%' }}
          >
            {isLoading ? (
              <div className="checkout-loading">
                <div className="checkout-loading__spinner" />
                <p>Загрузка...</p>
              </div>
            ) : error ? (
              <div className="checkout-error">
                <span className="checkout-error__icon">⚠️</span>
                <p className="checkout-error__message">{error}</p>
                <Button variant="primary" onClick={handlePayWithRedirect} loading={isProcessing}>
                  Попробовать еще раз
                </Button>
              </div>
            ) : (
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
                  {isProcessing ? 'Переход...' : `Оплатить ${plan.priceTotal} ₽`}
                </Button>
                <div className="checkout-pay__security">
                  <span>🔒</span>
                  <span>Безопасная оплата через Т-Банк</span>
                </div>
              </div>
            )}
          </motion.div>

        </Stack>
      </div>
    </div>
  )
}

const pageStyles = `
.checkout-page {
  width: 100%;
  padding: var(--spacing-32);
  min-height: calc(100vh - var(--spacing-64));
  display: flex;
  flex-direction: column;
}

.checkout-back-nav {
  margin-bottom: var(--spacing-24);
}

.checkout-back-button {
  font-weight: 600 !important;
  color: var(--color-text-secondary) !important;
  padding-left: 0 !important;
}

.checkout-back-button:hover {
  color: var(--color-accent-base) !important;
}

.checkout-content {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 5vh;
}

.checkout-stack {
  width: 100%;
  max-width: 480px;
}

.checkout-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.checkout-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--color-neutral-110);
  margin-bottom: 12px;
  letter-spacing: -0.03em;
}

.checkout-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: transparent;
  padding: 0;
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

.checkout-loading,
.checkout-error,
.checkout-pay {
  background: transparent;
  padding: 32px 0;
  text-align: center;
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
  .checkout-page {
    padding: var(--spacing-16);
  }
  
  .checkout-title {
    font-size: 24px;
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
