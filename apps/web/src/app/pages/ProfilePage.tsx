/**
 * ProfilePage
 * Страница профиля пользователя
 * Объединена с данными аккаунта
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import { Container, Stack, Card, Button, EmptyState, Tooltip } from '@/ui'
import SubscriptionCard from '@/features/account/SubscriptionCard'
import UsageOverviewCard from '@/features/account/UsageOverviewCard'
import FairUseModeCard from '@/features/account/FairUseModeCard'
import CapabilitiesCard from '@/features/account/CapabilitiesCard'
import type { SubscriptionInfo, UsageInfo } from '@/features/account/types'
import { fetchMe, type MeResponse } from '@/shared/api/me'
import { useState, useEffect } from 'react'

function ProfilePage() {
  const { isAuthenticated, logout, user } = useAuth()
  const [meData, setMeResponse] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const shouldReduceMotion = false

  useEffect(() => {
    if (!isAuthenticated) return

    fetchMe()
      .then(setMeResponse)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const getInitials = (userId: string): string => {
    if (!userId) return '??'
    const cleanId = userId.replace(/-/g, '')
    return cleanId.substring(0, 2).toUpperCase()
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Войдите через лэндинг"
        description="Для просмотра профиля необходимо войти"
      />
    )
  }

  if (loading) {
    return (
      <Container size="lg">
        <p style={{ textAlign: 'center', paddingTop: 100 }}>Загрузка данных профиля...</p>
      </Container>
    )
  }

  const subscription: SubscriptionInfo = meData?.subscription || {
    planName: 'BASE 499',
    status: 'active',
    monthlyPriceRub: 499,
    nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  }

  const usage: UsageInfo = {
    tokensUsed: meData?.usage.tokensUsed || 0,
    tokensLimit: meData?.usage.tokensLimit || 100000,
    costRub: 0,
    costLimitRub: subscription.monthlyPriceRub,
  }

  return (
    <Container size="lg">
      <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-64)' }}>
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: motionTokens.duration.base,
            ease: motionTokens.easing.out,
          }}
        >
          <div className="profile-header">
            <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-12)' }}>
              Профиль
            </h1>
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
              Личные данные, информация о подписке и лимитах
            </p>
          </div>
        </motion.div>

        <Card>
          <div style={{ padding: 'var(--spacing-24)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-24)' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-accent-base)',
              color: 'var(--color-text-inverse)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-weight-bold)'
            }}>
              {user ? getInitials(user.id) : '??'}
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-4)' }}>
                Пользователь
              </h2>
              <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                ID: {user?.id}
              </p>
            </div>
          </div>
        </Card>

        <SubscriptionCard subscription={subscription} />
        <UsageOverviewCard usage={usage} />
        <FairUseModeCard mode={meData?.fairUseMode || 'normal'} />
        <CapabilitiesCard capabilities={meData?.capabilities || {
          streamingAvailable: true,
          maxTokensPerRequest: 8000,
          priority: 'normal',
          resultPersistence: true,
        }} />

        <motion.div
          className="profile-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: motionTokens.duration.base,
            ease: motionTokens.easing.out,
            delay: 0.4,
          }}
        >
          <div className="profile-actions__group">
            <Button variant="ghost" onClick={logout}>
              Выйти из аккаунта
            </Button>
            <Tooltip content="Функция будет доступна позже">
              <Button variant="ghost" disabled>
                Связаться с поддержкой
              </Button>
            </Tooltip>
          </div>
        </motion.div>
      </Stack>
    </Container>
  )
}

export default ProfilePage

const pageStyles = `
.profile-header {
  width: 100%;
}

.profile-actions {
  width: 100%;
  padding-top: var(--spacing-24);
  border-top: 1px solid var(--color-border-light);
}

.profile-actions__group {
  display: flex;
  gap: var(--spacing-16);
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .profile-actions__group {
    flex-direction: column;
  }
  
  .profile-actions__group button {
    width: 100%;
  }
}
`

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
