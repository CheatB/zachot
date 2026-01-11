/**
 * BillingPage
 * Страница оплаты и управления подпиской
 * Реализована в стиле лендинга с интеграцией эквайринга Т-Банка
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import { Container, Stack, Button, EmptyState } from '@/ui'
import { useState, useEffect, useMemo } from 'react'
import { initiatePayment } from '@/shared/api/payments'
import clsx from 'clsx'

type BillingPeriod = 'month' | 'quarter' | 'year'

function BillingPage() {
  const { isAuthenticated } = useAuth()
  const [period, setPeriod] = useState<BillingPeriod>('month')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'billing-page-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = billingStyles
    }
  }, [])

  const basePrice = 499

  const pricingData = useMemo(() => {
    switch (period) {
      case 'quarter': {
        const quarterMonthly = Math.round(basePrice * 0.9)
        return {
          monthly: quarterMonthly,
          total: quarterMonthly * 3,
          showTotal: true,
          showBadge: true,
          description: 'Подписка "Зачёт" — 3 месяца',
        }
      }
      case 'year': {
        const yearMonthly = Math.round(basePrice * 0.85)
        return {
          monthly: yearMonthly,
          total: yearMonthly * 12,
          showTotal: true,
          showBadge: false,
          description: 'Подписка "Зачёт" — 12 месяцев',
        }
      }
      default:
        return {
          monthly: basePrice,
          total: basePrice,
          showTotal: false,
          showBadge: false,
          description: 'Подписка "Зачёт" — 1 месяц',
        }
    }
  }, [period, basePrice])

  const handleCheckout = async () => {
    if (!isAuthenticated) return
    
    setIsProcessing(true)
    try {
      const { payment_url } = await initiatePayment(period)
      window.location.href = payment_url
    } catch (error) {
      console.error('Payment initiation failed:', error)
      alert('Не удалось инициализировать платеж. Попробуйте позже.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 'var(--spacing-48)' }}>
        <EmptyState
          title="Войдите через лэндинг"
          description="Для управления оплатой необходимо войти"
        />
      </div>
    )
  }

  const periods = [
    { id: 'month', label: 'На месяц' },
    { id: 'quarter', label: 'На 3 месяца', discount: '-10%' },
    { id: 'year', label: 'На целый год', discount: '-15%' },
  ]

  return (
    <Container size="full">
      <Stack align="center" gap="3xl" style={{ paddingTop: 'var(--spacing-80)', paddingBottom: 'var(--spacing-120)' }}>
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: motionTokens.easing.out }}
          style={{ textAlign: 'center', maxWidth: '800px' }}
        >
          <h1 className="billing-title">
            Начни экономить время уже с первой работы
          </h1>
          <p className="billing-subtitle">
            Подписка открывает доступ ко всем основным возможностям сервиса.
          </p>
        </motion.div>

        {/* Period Selector (Tabs) */}
        <div className="billing-tabs-wrapper">
          <div className="billing-tabs-container">
            {periods.map((p) => (
              <button
                key={p.id}
                className={clsx('billing-tab', period === p.id && 'billing-tab--active')}
                onClick={() => setPeriod(p.id as BillingPeriod)}
              >
                {p.label}
                {p.discount && <span className="billing-tab__discount">{p.discount}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="pricing-grid">
          {/* Free Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="pricing-card">
              <div className="pricing-card__badge-wrapper">
                <span className="pricing-badge">Попробовать</span>
              </div>
              
              <div className="pricing-card__header">
                <div className="pricing-card__plan-name">Бесплатно</div>
                <div className="pricing-card__price">0 ₽</div>
                <p className="pricing-card__subtext">
                  Попробуй возможности сервиса без оплаты.
                </p>
              </div>

              <div className="pricing-card__features">
                <div className="feature-item">
                  <span className="feature-item__icon">✓</span>
                  <span className="feature-item__text">Решить 3 задачи</span>
                </div>
                <div className="feature-item">
                  <span className="feature-item__icon">✓</span>
                  <span className="feature-item__text">Создать содержание одной работы</span>
                </div>
              </div>

              <div className="pricing-card__footer">
                <Button variant="secondary" className="pricing-button" disabled>
                  Текущий тариф
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Paid Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className={clsx('pricing-card pricing-card--featured', pricingData.showBadge && 'pricing-card--has-badge')}>
              {pricingData.showBadge && (
                <div className="pricing-card__badge-wrapper">
                  <span className="pricing-badge pricing-badge--featured">Популярный выбор</span>
                </div>
              )}
              
              <div className="pricing-card__header">
                <div className="pricing-card__total-hint">
                  {pricingData.showTotal ? `${pricingData.total} ₽ за весь период` : <>&nbsp;</>}
                </div>
                <div className="pricing-card__price">
                  <motion.span
                    key={pricingData.monthly}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {pricingData.monthly}
                  </motion.span>
                  <span className="pricing-card__currency"> ₽</span>
                  <span className="pricing-card__period"> / месяц</span>
                </div>
                <p className="pricing-card__subtext">
                  Полный доступ к инструментам «Зачёта».
                </p>
              </div>

              <div className="pricing-card__features">
                <div className="feature-item">
                  <span className="feature-item__icon">✓</span>
                  <span className="feature-item__text">До 5 рефератов и курсовых в месяц</span>
                </div>
                <div className="feature-item">
                  <span className="feature-item__icon">✓</span>
                  <span className="feature-item__text">Гибкая система кредитов: реферат = 1, курсовая = 3</span>
                </div>
                <div className="feature-item">
                  <span className="feature-item__icon">✓</span>
                  <span className="feature-item__text">Онлайн-редактор и выгрузка в файл</span>
                </div>
              </div>

              <div className="pricing-card__footer">
                <Button 
                  variant="primary" 
                  className="pricing-button pricing-button--featured"
                  onClick={handleCheckout}
                  loading={isProcessing}
                >
                  Улучшить подписку
                </Button>
                <div className="pricing-card__note">Можно отменить подписку в любой момент</div>
              </div>
            </div>
          </motion.div>
        </div>

      </Stack>
    </Container>
  )
}

const billingStyles = `
.billing-title {
  font-size: 42px;
  font-weight: 800;
  color: #020617;
  margin-bottom: 24px;
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.billing-subtitle {
  font-size: 18px;
  color: #64748b;
  line-height: 1.6;
  max-width: 500px;
  margin: 0 auto;
}

.billing-tabs-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 16px;
}

.billing-tabs-container {
  display: flex;
  background-color: #f1f5f9;
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
}

.billing-tab {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
}

.billing-tab--active {
  background-color: #333333;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.billing-tab__discount {
  font-size: 11px;
  color: #94a3b8;
  font-weight: normal;
}

.billing-tab--active .billing-tab__discount {
  color: rgba(255, 255, 255, 0.6);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 480px));
  gap: 32px;
  justify-content: center;
  width: 100%;
  max-width: 1040px;
  padding: 0 24px;
  margin-top: 32px;
}

.pricing-card {
  background: #ffffff;
  border: 1px solid #cbd5f5;
  border-radius: 28px;
  padding: 56px 48px;
  width: 100%;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
  position: relative;
  transition: all 0.18s ease-out;
  display: flex;
  flex-direction: column;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 55px rgba(15, 23, 42, 0.15);
}

.pricing-card--featured {
  border-top: 3px solid #16a34a;
}

.pricing-card--has-badge {
  border: 1px solid #cbd5f5;
  border-top: 3px solid #16a34a;
}

.pricing-card__badge-wrapper {
  position: absolute;
  top: 20px;
  left: 28px;
}

.pricing-badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(198, 228, 138, 0.32);
  color: #6b7280;
  font-size: 11px;
  font-weight: 500;
}

.pricing-badge--featured {
  background: rgba(198, 228, 138, 0.32);
  color: #6b7280;
}

.pricing-card__header {
  text-align: center;
  margin-bottom: 40px;
}

.pricing-card__total-hint {
  font-size: 16px;
  color: #94a3b8;
  height: 24px;
  margin-bottom: 4px;
  transition: opacity 0.2s ease;
}

.pricing-card__plan-name {
  font-size: 20px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
  margin-top: 24px;
}

.pricing-card__price {
  font-size: 56px;
  font-weight: 750;
  color: #020617;
  line-height: 1.1;
  margin: 32px 0 12px 0;
  letter-spacing: -0.02em;
}

.pricing-card__currency {
  font-size: 56px;
}

.pricing-card__period {
  font-size: 18px;
  color: #6b7280;
  font-weight: 400;
  margin-left: 8px;
}

.pricing-card__subtext {
  font-size: 19px;
  color: #9a9fa9;
  line-height: 1.65;
  margin-bottom: 32px;
}

.pricing-card__features {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 32px 0;
}

.feature-item {
  display: flex;
  gap: 12px;
  align-items: center;
}

.feature-item__icon {
  color: #16a34a;
  flex-shrink: 0;
  font-size: 20px;
}

.feature-item__text {
  font-size: 19px;
  color: #020617;
  line-height: 1.65;
  font-weight: 400;
}

.pricing-card__footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  margin-top: auto;
}

.pricing-button {
  width: 100%;
  height: 50px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  background-color: white;
  border: 1px solid #cbd5f5;
  color: #020617;
  cursor: pointer;
  transition: all 0.18s ease-out;
}

.pricing-button--featured {
  background-color: #16a34a;
  border: none;
  color: white;
}

.pricing-button--featured:hover {
  background-color: #15803d;
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(22, 163, 74, 0.4);
}

.pricing-card__note {
  position: absolute;
  bottom: 20px;
  right: 28px;
  font-size: 9px;
  color: #9a9fa9;
}

@media (max-width: 768px) {
  .pricing-grid {
    grid-template-columns: 1fr;
    padding: 0 24px;
  }
  .billing-title {
    font-size: 32px;
  }
  .pricing-card {
    padding: 32px 24px;
  }
  .pricing-card__price {
    font-size: 48px;
  }
  .pricing-card__note {
    position: static;
    margin-top: 16px;
    text-align: center;
  }
}
`

export default BillingPage
