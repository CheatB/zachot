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
      case 'quarter':
        const quarterMonthly = Math.round(basePrice * 0.9)
        return {
          monthly: quarterMonthly,
          total: quarterMonthly * 3,
          showTotal: true,
          showBadge: true,
          description: 'Подписка "Зачёт" — 3 месяца',
        }
      case 'year':
        const yearMonthly = Math.round(basePrice * 0.85)
        return {
          monthly: yearMonthly,
          total: yearMonthly * 12,
          showTotal: true,
          showBadge: false,
          description: 'Подписка "Зачёт" — 12 месяцев',
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
  }, [period])

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
                  <span className="feature-item__text">5 текстовых работ и презентаций</span>
                </div>
                <div className="feature-item">
                  <span className="feature-item__icon">✓</span>
                  <span className="feature-item__text">Пошаговое построение структуры и текста</span>
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
  padding: 6px;
  border-radius: 12px;
  gap: 4px;
}

.billing-tab {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
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
  background-color: #334155;
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
  grid-template-columns: repeat(auto-fit, minmax(320px, 420px));
  gap: 32px;
  justify-content: center;
  width: 100%;
  padding: 0 24px;
  margin-top: 32px;
}

.pricing-card {
  height: 100%;
  padding: 64px 40px 48px;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  border: 1px solid #e2e8f0;
  background: white;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04);
}

.pricing-card--featured {
  border: 2px solid #e2e8f0;
}

.pricing-card--has-badge {
  border: 2px solid #16a34a;
  box-shadow: 0 20px 40px rgba(22, 163, 74, 0.08);
}

.pricing-card__badge-wrapper {
  position: absolute;
  top: 24px;
  left: 24px;
}

.pricing-badge {
  background-color: #f1f5f9;
  color: #64748b;
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
}

.pricing-badge--featured {
  background-color: #f0fdf4;
  color: #16a34a;
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
  font-size: 18px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 12px;
}

.pricing-card__price {
  font-size: 72px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 24px;
  letter-spacing: -0.04em;
}

.pricing-card__currency {
  font-size: 32px;
  vertical-align: super;
}

.pricing-card__period {
  font-size: 18px;
  color: #94a3b8;
  font-weight: 500;
}

.pricing-card__subtext {
  font-size: 16px;
  color: #64748b;
  line-height: 1.5;
  max-width: 280px;
  margin: 0 auto;
}

.pricing-card__features {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 48px;
}

.feature-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.feature-item__icon {
  color: #16a34a;
  font-weight: bold;
  flex-shrink: 0;
  font-size: 18px;
}

.feature-item__text {
  font-size: 16px;
  color: #1e293b;
  line-height: 1.4;
  font-weight: 500;
}

.pricing-card__footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.pricing-button {
  width: 100%;
  height: 56px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  background-color: white;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pricing-button--featured {
  background-color: #16a34a;
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
}

.pricing-button--featured:hover {
  background-color: #15803d;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.3);
}

.pricing-card__note {
  font-size: 11px;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .pricing-grid {
    grid-template-columns: 1fr;
  }
  .billing-title {
    font-size: 32px;
  }
}
`

export default BillingPage
