/**
 * AccountPage
 * Страница аккаунта с информацией о подписке, использовании и возможностях
 */

import { motion, useReducedMotion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import AppShell from '@/app/layout/AppShell'
import { Container, Stack, Button, EmptyState, Tooltip } from '@/ui'
import SubscriptionCard from './SubscriptionCard'
import UsageOverviewCard from './UsageOverviewCard'
import FairUseModeCard from './FairUseModeCard'
import CapabilitiesCard from './CapabilitiesCard'
import type { SubscriptionInfo, UsageInfo, FairUseMode, Capabilities } from './types'

// Mock данные
const mockSubscription: SubscriptionInfo = {
  planName: 'BASE 499',
  status: 'active',
  monthlyPriceRub: 499,
  nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // через 15 дней
}

const mockUsage: UsageInfo = {
  tokensUsed: 34200,
  tokensLimit: 100000,
  costRub: 172.45,
  costLimitRub: 499,
}

const mockFairUseMode: FairUseMode = 'normal'

const mockCapabilities: Capabilities = {
  streamingAvailable: true,
  maxTokensPerRequest: 8000,
  priority: 'normal',
  resultPersistence: true,
}

function AccountPage() {
  const { isAuthenticated, logout } = useAuth()
  const shouldReduceMotion = useReducedMotion()

  const handleLogout = () => {
    logout()
  }

  if (!isAuthenticated) {
    return (
      <AppShell>
        <EmptyState
          title="Войдите через лэндинг"
          description="Для просмотра аккаунта необходимо войти"
        />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Container size="lg">
        <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
          {/* Account Header */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
            }}
          >
            <div className="account-header">
              <h1
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-12)',
                }}
              >
                Аккаунт
              </h1>
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--line-height-relaxed)',
                }}
              >
                Информация о вашем тарифе, использовании и доступных возможностях
              </p>
            </div>
          </motion.div>

          {/* Subscription Card */}
          <SubscriptionCard subscription={mockSubscription} />

          {/* Usage Overview Card */}
          <UsageOverviewCard usage={mockUsage} />

          {/* Fair Use Mode Card */}
          <FairUseModeCard mode={mockFairUseMode} />

          {/* Capabilities Card */}
          <CapabilitiesCard capabilities={mockCapabilities} />

          {/* Secondary Actions */}
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
    </AppShell>
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

