/**
 * BillingPage
 * Страница оплаты и управления подпиской
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import AppShell from '@/app/layout/AppShell'
import { Container, Stack, Card, Button, Badge, EmptyState, Progress, Tooltip } from '@/ui'
import { fetchMe, type MeResponse } from '@/shared/api/me'
import { useState, useEffect } from 'react'

function BillingPage() {
  const { isAuthenticated, user } = useAuth()
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

  if (!isAuthenticated) {
    return (
      <AppShell isAuthenticated={isAuthenticated} user={user}>
        <EmptyState
          title="Войдите через лэндинг"
          description="Для управления оплатой необходимо войти"
        />
      </AppShell>
    )
  }

  if (loading) {
    return (
      <AppShell isAuthenticated={isAuthenticated} user={user}>
        <Container size="lg">
          <p style={{ textAlign: 'center', paddingTop: 100 }}>Загрузка данных оплаты...</p>
        </Container>
      </AppShell>
    )
  }

  const generationsUsed = meData?.usage.generationsUsed || 0
  const generationsLimit = meData?.usage.generationsLimit || 5
  const percentage = (generationsUsed / generationsLimit) * 100
  const monthlyPrice = meData?.subscription.monthlyPriceRub || 499
  const planName = meData?.subscription.planName || 'Студент Плюс'

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
              Оплата и тариф
            </h1>
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
              Управляйте своей подпиской и отслеживайте лимиты генераций
            </p>
          </motion.div>

          <Card>
            <div style={{ padding: 'var(--spacing-24)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-20)' }}>
                <div>
                  <Badge status="success" style={{ marginBottom: 'var(--spacing-8)' }}>Подписка активна</Badge>
                  <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                    {planName}
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                    {monthlyPrice} ₽
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    в месяц
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--spacing-24)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-8)' }}>
                  <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)' }}>
                    Использовано генераций
                  </span>
                  <span style={{ fontWeight: 'var(--font-weight-bold)' }}>
                    {generationsUsed} / {generationsLimit}
                  </span>
                </div>
                <Progress value={percentage} />
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-12)' }}>
                  Лимит обновляется 1-го числа каждого месяца. Одна генерация включает полный цикл от темы до экспорта файла.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-12)', flexWrap: 'wrap' }}>
                <Tooltip content="Функция будет доступна позже">
                  <Button variant="primary" disabled>Продлить подписку</Button>
                </Tooltip>
                <Tooltip content="Функция будет доступна позже">
                  <Button variant="secondary" disabled>История платежей</Button>
                </Tooltip>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ padding: 'var(--spacing-24)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-16)' }}>
                Что входит в подписку?
              </h3>
              <Stack gap="sm">
                <div style={{ display: 'flex', gap: 'var(--spacing-12)' }}>
                  <span style={{ color: 'var(--color-success-base)' }}>✓</span>
                  <span>5 полных генераций работ в месяц</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-12)' }}>
                  <span style={{ color: 'var(--color-success-base)' }}>✓</span>
                  <span>Экспорт в .docx, .pdf и .pptx</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-12)' }}>
                  <span style={{ color: 'var(--color-success-base)' }}>✓</span>
                  <span>Поиск реальных источников в интернете</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-12)' }}>
                  <span style={{ color: 'var(--color-success-base)' }}>✓</span>
                  <span>Умный редактор стиля текста</span>
                </div>
              </Stack>
            </div>
          </Card>
        </Stack>
      </Container>
    </AppShell>
  )
}

export default BillingPage
