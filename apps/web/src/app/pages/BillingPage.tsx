/**
 * BillingPage
 * Страница оплаты и управления подпиской
 * Реализована в стиле лендинга с интеграцией эквайринга Т-Банка
 * 
 * Поддерживает разные состояния:
 * - Без подписки: показывает тарифы для покупки
 * - Активная подписка: показывает информацию о подписке + возможность продления
 * - Истекающая подписка: предупреждение + CTA продлить
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import { Container, Stack, Button, EmptyState } from '@/ui'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'

type BillingPeriod = 'month' | 'quarter' | 'year'

// Маппинг названий планов к периодам
const PLAN_TO_PERIOD: Record<string, BillingPeriod> = {
  'MONTH': 'month',
  'QUARTER': 'quarter',
  'YEAR': 'year',
  'BASE 499': 'month',
}

function BillingPage() {
  const { isAuthenticated, user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [period, setPeriod] = useState<BillingPeriod>('month')
  const [showFailMessage, setShowFailMessage] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // Данные о подписке пользователя
  const subscription = user?.subscription
  const usage = user?.usage
  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'expiring'
  const currentPeriod = subscription?.planName ? PLAN_TO_PERIOD[subscription.planName] || 'month' : null

  // Проверяем статус оплаты из URL
  useEffect(() => {
    const status = searchParams.get('status')
    const payment = searchParams.get('payment')
    
    if (status === 'fail') {
      setShowFailMessage(true)
      console.log('[BillingPage] Payment failed, showing message')
    }
    
    if (status === 'success' || payment === 'demo_success') {
      setShowSuccessMessage(true)
      console.log('[BillingPage] Payment success, refreshing user data')
      // Обновляем данные пользователя после успешной оплаты
      refreshUser()
    }
  }, [searchParams, refreshUser])

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

  const basePrice = 799

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

  const handleCheckout = () => {
    if (!isAuthenticated) return
    console.log(`[BillingPage] Navigating to checkout: period=${period}`)
    navigate(`/billing/checkout?period=${period}`)
  }

  // Форматирование даты
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  // Расчёт дней до окончания
  const getDaysUntilExpiry = () => {
    if (!subscription?.nextBillingDate) return null
    const now = new Date()
    const expiry = new Date(subscription.nextBillingDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilExpiry = getDaysUntilExpiry()
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0

  // Определяем текст и состояние кнопки
  const getButtonState = () => {
    if (!hasActiveSubscription) {
      return { text: 'Оформить подписку', disabled: false, variant: 'primary' as const }
    }
    
    if (currentPeriod === period) {
      return { text: 'Текущий тариф', disabled: true, variant: 'secondary' as const }
    }
    
    // Можно только апгрейдить на более длинный период
    const periodOrder = { month: 1, quarter: 2, year: 3 }
    if (periodOrder[period] > periodOrder[currentPeriod || 'month']) {
      return { text: `Продлить на ${period === 'year' ? 'год' : '3 месяца'}`, disabled: false, variant: 'primary' as const }
    }
    
    return { text: 'Текущий или меньший период', disabled: true, variant: 'secondary' as const }
  }

  const buttonState = getButtonState()

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
      <Stack align="center" gap="3xl" className="billing-stack" style={{ paddingTop: 'var(--spacing-48)', paddingBottom: 'var(--spacing-120)' }}>
        
        {/* Success Message */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="billing-success-message"
          >
            <span>✅</span>
            <span>Оплата прошла успешно! Подписка активирована.</span>
            <button onClick={() => setShowSuccessMessage(false)}>✕</button>
          </motion.div>
        )}
        
        {/* Payment Failed Message */}
        {showFailMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="billing-fail-message"
          >
            <span>⚠️</span>
            <span>Оплата не прошла. Пожалуйста, попробуйте ещё раз или выберите другой способ оплаты.</span>
            <button onClick={() => setShowFailMessage(false)}>✕</button>
          </motion.div>
        )}

        {/* Active Subscription Card */}
        {hasActiveSubscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="subscription-card"
          >
            <div className="subscription-card__header">
              <div className="subscription-card__status">
                <span className={clsx(
                  'subscription-status-badge',
                  subscription?.status === 'active' && 'subscription-status-badge--active',
                  subscription?.status === 'expiring' && 'subscription-status-badge--expiring',
                )}>
                  {subscription?.status === 'active' ? '✓ Активна' : '⏰ Истекает'}
                </span>
              </div>
              <h2 className="subscription-card__title">Ваша подписка</h2>
            </div>

            <div className="subscription-card__details">
              <div className="subscription-detail">
                <span className="subscription-detail__label">Тариф</span>
                <span className="subscription-detail__value">
                  {subscription?.planName === 'MONTH' && 'Зачёт на 1 месяц'}
                  {subscription?.planName === 'QUARTER' && 'Зачёт на 3 месяца'}
                  {subscription?.planName === 'YEAR' && 'Зачёт на 12 месяцев'}
                  {subscription?.planName === 'BASE 499' && 'Зачёт на 1 месяц'}
                </span>
              </div>
              <div className="subscription-detail">
                <span className="subscription-detail__label">Действует до</span>
                <span className={clsx(
                  'subscription-detail__value',
                  isExpiringSoon && 'subscription-detail__value--warning'
                )}>
                  {formatDate(subscription?.nextBillingDate)}
                  {isExpiringSoon && ` (${daysUntilExpiry} дн.)`}
                </span>
              </div>
              <div className="subscription-detail">
                <span className="subscription-detail__label">Автопродление</span>
                <span className="subscription-detail__value">
                  {subscription?.autoRenew !== false ? 'Включено' : 'Отключено'}
                </span>
              </div>
            </div>

            {/* Usage Progress */}
            {usage && (
              <div className="subscription-card__usage">
                <div className="usage-item">
                  <div className="usage-item__header">
                    <span className="usage-item__label">Генерации</span>
                    <span className="usage-item__count">{usage.generationsUsed} / {usage.generationsLimit}</span>
                  </div>
                  <div className="usage-item__bar">
                    <div 
                      className="usage-item__progress" 
                      style={{ width: `${Math.min(100, (usage.generationsUsed / usage.generationsLimit) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Expiring Warning */}
            {isExpiringSoon && (
              <div className="subscription-card__warning">
                <span>⚠️</span>
                <span>Подписка истекает через {daysUntilExpiry} {daysUntilExpiry === 1 ? 'день' : daysUntilExpiry && daysUntilExpiry < 5 ? 'дня' : 'дней'}. Продлите, чтобы не потерять доступ.</span>
              </div>
            )}

            <div className="subscription-card__actions">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {/* TODO: Отмена автопродления */}}
              >
                {subscription?.autoRenew !== false ? 'Отменить автопродление' : 'Включить автопродление'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: motionTokens.easing.out }}
          style={{ textAlign: 'center', maxWidth: '800px' }}
        >
          <h1 className="billing-title">
            {hasActiveSubscription 
              ? 'Продлите подписку с выгодой'
              : 'Начни экономить время уже с первой работы'
            }
          </h1>
          <p className="billing-subtitle">
            {hasActiveSubscription
              ? 'Выберите более длинный период и сэкономьте до 15%'
              : 'Подписка открывает доступ ко всем основным возможностям сервиса.'
            }
          </p>
        </motion.div>

        {/* Period Selector (Tabs) */}
        <div className="billing-tabs-wrapper">
          <div className="billing-tabs-container">
            {periods.map((p) => (
              <button
                key={p.id}
                className={clsx(
                  'billing-tab', 
                  period === p.id && 'billing-tab--active',
                  hasActiveSubscription && currentPeriod === p.id && 'billing-tab--current'
                )}
                onClick={() => setPeriod(p.id as BillingPeriod)}
              >
                {p.label}
                {p.discount && <span className="billing-tab__discount">{p.discount}</span>}
                {hasActiveSubscription && currentPeriod === p.id && (
                  <span className="billing-tab__current">текущий</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="pricing-grid">
          {/* Free Card - показываем только если нет подписки */}
          {!hasActiveSubscription && (
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
          )}

          {/* Paid Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: hasActiveSubscription ? 0.2 : 0.3 }}
            style={hasActiveSubscription ? { gridColumn: '1 / -1', maxWidth: '500px', margin: '0 auto' } : undefined}
          >
            <div className={clsx(
              'pricing-card pricing-card--featured', 
              pricingData.showBadge && 'pricing-card--has-badge',
              hasActiveSubscription && currentPeriod === period && 'pricing-card--current'
            )}>
              {pricingData.showBadge && !hasActiveSubscription && (
                <div className="pricing-card__badge-wrapper">
                  <span className="pricing-badge pricing-badge--featured">Популярный выбор</span>
                </div>
              )}
              {hasActiveSubscription && currentPeriod === period && (
                <div className="pricing-card__badge-wrapper">
                  <span className="pricing-badge pricing-badge--current">Ваш тариф</span>
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
                  <span className="feature-item__text">
                    {period === 'month' && '500 кредитов (~7 рефератов или 2 курсовых)'}
                    {period === 'quarter' && '1500 кредитов (~22 реферата или 7 курсовых)'}
                    {period === 'year' && '6000 кредитов (~88 рефератов или 28 курсовых)'}
                  </span>
                </div>
                <div className="feature-item">
                  <span className="feature-item__icon">✓</span>
                  <span className="feature-item__text">Пошаговое построение структуры и текста</span>
                </div>
                <div className="feature-item">
                  <span className="feature-item__icon">✓</span>
                  <span className="feature-item__text">Онлайн-редактор и выгрузка в файл</span>
                </div>
                {period !== 'month' && (
                  <div className="feature-item feature-item--highlight">
                    <span className="feature-item__icon">💰</span>
                    <span className="feature-item__text">
                      Экономия {period === 'quarter' ? '240' : '1436'} ₽
                    </span>
                  </div>
                )}
              </div>

              <div className="pricing-card__footer">
                <Button 
                  variant={buttonState.variant}
                  className={clsx(
                    'pricing-button',
                    buttonState.variant === 'primary' && 'pricing-button--featured'
                  )}
                  onClick={handleCheckout}
                  disabled={buttonState.disabled}
                >
                  {buttonState.text}
                </Button>
                <div className="pricing-card__note">
                  {hasActiveSubscription 
                    ? 'Новый период добавится к текущему'
                    : 'Можно отменить подписку в любой момент'
                  }
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </Stack>
    </Container>
  )
}

const billingStyles = `
.billing-success-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  color: #16a34a;
  font-size: 14px;
  max-width: 600px;
  width: 100%;
}

.billing-success-message button {
  margin-left: auto;
  background: none;
  border: none;
  color: #16a34a;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.billing-fail-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
  font-size: 14px;
  max-width: 600px;
  width: 100%;
}

.billing-fail-message button {
  margin-left: auto;
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

/* Subscription Card */
.subscription-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #bbf7d0;
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 600px;
}

.subscription-card__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.subscription-card__title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.subscription-status-badge {
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
}

.subscription-status-badge--active {
  background-color: #16a34a;
  color: white;
}

.subscription-status-badge--expiring {
  background-color: #f59e0b;
  color: white;
}

.subscription-card__details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.subscription-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subscription-detail__label {
  font-size: 14px;
  color: #64748b;
}

.subscription-detail__value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.subscription-detail__value--warning {
  color: #f59e0b;
}

.subscription-card__usage {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.usage-item__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.usage-item__label {
  font-size: 13px;
  color: #64748b;
}

.usage-item__count {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.usage-item__bar {
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.usage-item__progress {
  height: 100%;
  background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.subscription-card__warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #fef3c7;
  border-radius: 10px;
  font-size: 13px;
  color: #92400e;
  margin-bottom: 20px;
}

.subscription-card__actions {
  display: flex;
  justify-content: center;
}

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
  padding: 0 16px;
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
  position: relative;
}

.billing-tab--active {
  background-color: #334155;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.billing-tab--current::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background-color: #16a34a;
  border-radius: 50%;
}

.billing-tab__discount {
  font-size: 11px;
  color: #94a3b8;
  font-weight: normal;
}

.billing-tab--active .billing-tab__discount {
  color: rgba(255, 255, 255, 0.6);
}

.billing-tab__current {
  font-size: 10px;
  color: #16a34a;
  font-weight: 500;
  text-transform: uppercase;
}

.billing-tab--active .billing-tab__current {
  color: #86efac;
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

.pricing-card--current {
  border: 2px solid #16a34a;
  background: linear-gradient(180deg, #f0fdf4 0%, white 30%);
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

.pricing-badge--current {
  background-color: #16a34a;
  color: white;
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

.feature-item--highlight {
  background-color: #fef3c7;
  padding: 12px 16px;
  border-radius: 10px;
  margin-top: 8px;
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

.pricing-button--featured:hover:not(:disabled) {
  background-color: #15803d;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.3);
}

.pricing-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pricing-card__note {
  font-size: 11px;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .billing-stack {
    padding-top: var(--spacing-24) !important;
    padding-bottom: var(--spacing-64) !important;
    gap: var(--spacing-24) !important;
  }
  
  .billing-title {
    font-size: 28px;
  }
  
  .billing-subtitle {
    font-size: 15px;
    padding: 0 8px;
  }
  
  .billing-tabs-container {
    flex-direction: column;
    width: 100%;
    padding: 8px;
  }
  
  .billing-tab {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
  }
  
  .pricing-grid {
    grid-template-columns: 1fr;
    padding: 0 8px;
    gap: 20px;
  }
  
  .pricing-card {
    padding: 48px 24px 32px;
  }
  
  .pricing-card__price {
    font-size: 48px;
  }
  
  .pricing-card__currency {
    font-size: 24px;
  }
  
  .pricing-card__period {
    font-size: 14px;
  }
  
  .pricing-card__subtext {
    font-size: 14px;
  }
  
  .feature-item__text {
    font-size: 14px;
  }
  
  .pricing-button {
    height: 52px;
    font-size: 15px;
  }
  
  .subscription-card {
    padding: 24px;
  }
  
  .subscription-card__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .billing-title {
    font-size: 24px;
  }
  
  .pricing-card {
    padding: 40px 20px 28px;
  }
  
  .pricing-card__price {
    font-size: 40px;
  }
}
`

export default BillingPage
