/**
 * AccountPage
 * Страница аккаунта с информацией о подписке, использовании и возможностях
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import { Container, Stack, Button, EmptyState, Tooltip } from '@/ui'
import SubscriptionCard from './SubscriptionCard'
import UsageOverviewCard from './UsageOverviewCard'
import FairUseModeCard from './FairUseModeCard'
import CapabilitiesCard from './CapabilitiesCard'
import type { SubscriptionInfo, UsageInfo, FairUseMode, Capabilities } from './types'
import { fetchMe, type MeResponse } from '@/shared/api/me'
import { useState, useEffect } from 'react'

const mockFairUseMode: FairUseMode = 'normal'

const mockCapabilities: Capabilities = {
  streamingAvailable: true,
  maxTokensPerRequest: 8000,
  priority: 'normal',
  resultPersistence: true,
}

function AccountPage() {
  const { isAuthenticated, logout } = useAuth()
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

  const handleLogout = () => {
    logout()
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Войдите через лэндинг"
        description="Для просмотра аккаунта необходимо войти"
      />
    )
  }

  if (loading) {
    return (
      <Container size="lg">
        <p style={{ textAlign: 'center', paddingTop: 100 }}>Загрузка данных аккаунта...</p>
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
      <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: motionTokens.duration.base,
            ease: motionTokens.easing.out,
          }}
        >
          <div className="account-header">
            <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-12)' }}>
              Аккаунт
            </h1>
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
              Информация о вашем тарифе, использовании и доступных возможностях
            </p>
          </div>
        </motion.div>

        <SubscriptionCard subscription={subscription} />
        <UsageOverviewCard usage={usage} />
        <FairUseModeCard mode={mockFairUseMode} />
        <CapabilitiesCard capabilities={mockCapabilities} />

        <motion.div
          className="account-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: motionTokens.duration.base,
            ease: motionTokens.easing.out,
            delay: 0.4,
          }}
        >
          <div className="account-actions__group">
            <Button variant="ghost" onClick={handleLogout}>
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

export default AccountPage

const pageStyles = `
.account-header {
  width: 100%;
}

.account-actions {
  width: 100%;
  padding-top: var(--spacing-24);
  border-top: 1px solid var(--color-border-light);
}

.account-actions__group {
  display: flex;
  gap: var(--spacing-16);
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .account-actions__group {
    flex-direction: column;
  }
  
  .account-actions__group button {
    width: 100%;
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'account-page-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = pageStyles
    document.head.appendChild(style)
  }
}
