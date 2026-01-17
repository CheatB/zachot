/**
 * CheckoutPage
 * Страница оформления подписки с редиректом на платёжную форму Т-Банка.
 * 
 * Простой flow:
 * 1. Показываем информацию о заказе
 * 2. При нажатии "Оплатить" → запрос к API → редирект на PaymentURL
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Container, Stack, Button, Card } from '@/ui'
import { initiatePayment } from '@/shared/api/payments'
import { useAuth } from '@/app/auth/useAuth'

type Period = 'month' | 'quarter' | 'year'

const PLAN_INFO: Record<Period, { name: string; price: number; priceTotal: number; months: number }> = {
  month: {
    name: '1 месяц',
    price: 799,
    priceTotal: 799,
    months: 1,
  },
  quarter: {
    name: '3 месяца',
    price: 719,
    priceTotal: 2157,
    months: 3,
  },
  year: {
    name: '12 месяцев',
    price: 679,
    priceTotal: 8148,
    months: 12,
  },
}

function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  
  const period = (searchParams.get('period') as Period) || 'month'
  const plan = PLAN_INFO[period]
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Логирование для отладки
  const log = useCallback((message: string, data?: unknown) => {
    console.log(`[CheckoutPage] ${message}`, data || '')
  }, [])

  // Редирект если не авторизован
  useEffect(() => {
    if (!isAuthenticated) {
      log('User not authenticated, redirecting to login...')
      navigate('/login')
    }
  }, [isAuthenticated, navigate, log])

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

  // Обработчик оплаты
  const handlePay = async () => {
    log(`Starting payment for period: ${period}`)
    setIsProcessing(true)
    setError(null)
    
    try {
      const result = await initiatePayment(period)
      log('Payment initiated:', result)
      
      // Проверяем демо-режим
      if (result.payment_url.includes('status=demo')) {
        log('Demo mode detected, simulating payment success...')
        // В демо-режиме редиректим на главную с сообщением об успехе
        navigate('/?payment=demo_success&order_id=' + result.order_id)
        return
      }
      
      // Редирект на платёжную форму Т-Банка
      window.location.href = result.payment_url
      
    } catch (err) {
      log('Payment initiation failed:', err)
      setError(
        err instanceof Error 
          ? err.message 
          : 'Не удалось инициализировать платёж. Попробуйте позже.'
      )
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
                Автопродление каждые {plan.months === 1 ? '30 дней' : `${plan.months} мес.`}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Pay Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ width: '100%' }}
        >
          <Card className="checkout-pay-card">
            <div className="checkout-pay">
              {error && (
                <div className="checkout-error">
                  <span className="checkout-error__icon">⚠️</span>
                  <p className="checkout-error__message">{error}</p>
                </div>
              )}
              
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handlePay}
                loading={isProcessing}
                disabled={isProcessing}
                className="checkout-pay__button"
              >
                {isProcessing ? 'Переход к оплате...' : `Оплатить ${plan.priceTotal} ₽`}
              </Button>
              
              <div className="checkout-pay__security">
                <span>🔒</span>
                <span>Безопасная оплата через Т-Банк</span>
              </div>
            </div>
          </Card>
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

.checkout-pay-card {
  padding: 32px !important;
}

.checkout-pay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.checkout-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 12px;
  width: 100%;
}

.checkout-error__icon {
  font-size: 32px;
}

.checkout-error__message {
  color: var(--color-danger-base);
  font-size: 14px;
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
