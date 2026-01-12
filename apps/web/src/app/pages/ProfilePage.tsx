/**
 * ProfilePage
 * Страница профиля пользователя
 * Простой вид с разделами без карточек
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import { Container, Stack, Button, EmptyState, Badge } from '@/ui'
import { fetchMe, type MeResponse } from '@/shared/api/me'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function ProfilePage() {
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()
  const [meData, setMeData] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return

    fetchMe()
      .then(setMeData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  // Инжектим стили
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'profile-page-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = pageStyles
    }
  }, [])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num)
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Войдите в аккаунт"
        description="Для просмотра профиля необходимо войти"
      />
    )
  }

  if (loading) {
    return (
      <Container size="md">
        <p style={{ textAlign: 'center', paddingTop: 100, color: 'var(--color-text-muted)' }}>
          Загрузка...
        </p>
      </Container>
    )
  }

  const subscription = meData?.subscription
  const usage = meData?.usage

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active': return <Badge status="success">Активна</Badge>
      case 'expiring': return <Badge status="warn">Истекает</Badge>
      case 'paused': return <Badge status="neutral">Приостановлена</Badge>
      default: return <Badge status="neutral">Нет подписки</Badge>
    }
  }

  const getModeLabel = (mode?: string) => {
    switch (mode) {
      case 'normal': return 'Обычный'
      case 'degraded': return 'Щадящий'
      case 'strict': return 'Ограниченный'
      default: return 'Обычный'
    }
  }

  const creditsBalance = usage?.creditsBalance ?? 5
  const creditsUsed = usage?.creditsUsed ?? 0

  return (
    <Container size="md">
      <Stack gap="xl" className="profile-page">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: motionTokens.easing.out }}
        >
          <h1 className="profile-title">Профиль</h1>
        </motion.div>

        {/* Личные данные */}
        <motion.section 
          className="profile-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <h2 className="profile-section__title">Личные данные</h2>
          <div className="profile-fields">
            <div className="profile-field">
              <span className="profile-field__label">Аккаунт</span>
              <span className="profile-field__value" style={{ fontWeight: 'bold' }}>
                {user?.telegram_username ? `@${user.telegram_username}` : (user?.email || '—')}
              </span>
            </div>
            <div className="profile-field">
              <span className="profile-field__label">ID пользователя</span>
              <span className="profile-field__value profile-field__value--mono">{user?.id}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field__label">Роль</span>
              <span className="profile-field__value">{user?.role === 'admin' ? 'Администратор' : 'Пользователь'}</span>
            </div>
          </div>
        </motion.section>

        {/* Подписка */}
        <motion.section 
          className="profile-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="profile-section__title">Подписка</h2>
          <div className="profile-fields">
            <div className="profile-field">
              <span className="profile-field__label">Тариф</span>
              <span className="profile-field__value">{subscription?.planName || 'Бесплатный'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field__label">Статус</span>
              <span className="profile-field__value">{getStatusBadge(subscription?.status)}</span>
            </div>
            {subscription?.monthlyPriceRub && subscription.monthlyPriceRub > 0 && (
              <div className="profile-field">
                <span className="profile-field__label">Стоимость</span>
                <span className="profile-field__value">{subscription.monthlyPriceRub} ₽/мес</span>
              </div>
            )}
            {subscription?.nextBillingDate && (
              <div className="profile-field">
                <span className="profile-field__label">Следующее списание</span>
                <span className="profile-field__value">{formatDate(subscription.nextBillingDate)}</span>
              </div>
            )}
          </div>
          <div className="profile-section__actions">
            <Button variant="primary" size="sm" onClick={() => navigate('/billing')}>
              Управление подпиской
            </Button>
          </div>
        </motion.section>

        {/* Баланс кредитов */}
        <motion.section 
          className="profile-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h2 className="profile-section__title">Баланс кредитов</h2>
          <div className="profile-fields">
            <div className="profile-field">
              <span className="profile-field__label">Доступно кредитов</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-accent-base)' }}>
                {creditsBalance}
              </span>
              </div>
            <div className="profile-field">
              <span className="profile-field__label">Использовано за период</span>
              <span className="profile-field__value">{creditsUsed}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Реферат/эссе = 1 кредит • Курсовая = 3 кредита
            </p>
          </div>
        </motion.section>

        {/* Использование */}
        <motion.section 
          className="profile-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="profile-section__title">Технические лимиты</h2>
          <div className="profile-fields">
            {usage && (
              <div className="profile-field">
                <span className="profile-field__label">Токены использовано</span>
                <span className="profile-field__value">{formatNumber(usage.tokensUsed)} / {formatNumber(usage.tokensLimit)}</span>
              </div>
            )}
            <div className="profile-field">
              <span className="profile-field__label">Режим работы</span>
              <span className="profile-field__value">{getModeLabel(meData?.fairUseMode)}</span>
            </div>
          </div>
        </motion.section>

        {/* Действия */}
        <motion.div 
          className="profile-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Button variant="ghost" onClick={logout}>
            Выйти из аккаунта
          </Button>
        </motion.div>

      </Stack>
    </Container>
  )
}

const pageStyles = `
.profile-page {
  padding-top: var(--spacing-32);
  padding-bottom: var(--spacing-64);
}

.profile-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.profile-section {
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: var(--spacing-24);
}

.profile-section:last-of-type {
  border-bottom: none;
}

.profile-section__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--spacing-16) 0;
}

.profile-section__actions {
  margin-top: var(--spacing-16);
}

.profile-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
}

.profile-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-8) 0;
}

.profile-field--column {
  flex-direction: column;
  align-items: stretch;
  gap: var(--spacing-8);
}

.profile-field__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-field__label {
  font-size: 15px;
  color: var(--color-text-secondary);
}

.profile-field__value {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  text-align: right;
}

.profile-field__value--mono {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  color: var(--color-text-muted);
  word-break: break-all;
  max-width: 60%;
}

.profile-actions {
  padding-top: var(--spacing-16);
  display: flex;
  gap: var(--spacing-12);
}

@media (max-width: 640px) {
  .profile-page {
    padding-top: var(--spacing-24);
  }
  
  .profile-title {
    font-size: 24px;
  }
  
  .profile-field {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-4);
  }
  
  .profile-field__value {
    text-align: left;
  }
  
  .profile-field__value--mono {
    max-width: 100%;
  }
  
  .profile-actions {
    flex-direction: column;
  }
  
  .profile-actions button {
    width: 100%;
  }
}
`

export default ProfilePage
