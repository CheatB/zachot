/**
 * ProfilePage
 * Страница профиля пользователя
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import AppShell from '@/app/layout/AppShell'
import { Container, Stack, Card, Button, EmptyState } from '@/ui'

function ProfilePage() {
  const { isAuthenticated, user, logout } = useAuth()
  const shouldReduceMotion = false

  const getInitials = (userId: string): string => {
    if (!userId) return '??'
    const cleanId = userId.replace(/-/g, '')
    return cleanId.substring(0, 2).toUpperCase()
  }

  if (!isAuthenticated) {
    return (
      <AppShell isAuthenticated={isAuthenticated} user={user}>
        <EmptyState
          title="Войдите через лэндинг"
          description="Для просмотра профиля необходимо войти"
        />
      </AppShell>
    )
  }

  return (
    <AppShell isAuthenticated={isAuthenticated} user={user}>
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
            <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-12)' }}>
              Профиль
            </h1>
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
              Личные данные и настройки вашего аккаунта
            </p>
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

          <Card>
            <div style={{ padding: 'var(--spacing-24)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-16)' }}>
                Настройки
              </h3>
              <Stack gap="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Язык интерфейса</span>
                  <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Русский</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Уведомления</span>
                  <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-success-base)' }}>Включены</span>
                </div>
              </Stack>
            </div>
          </Card>

          <div style={{ paddingTop: 'var(--spacing-12)' }}>
            <Button variant="ghost" onClick={logout}>
              Выйти из аккаунта
            </Button>
          </div>
        </Stack>
      </Container>
    </AppShell>
  )
}

export default ProfilePage
