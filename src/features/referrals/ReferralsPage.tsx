/**
 * ReferralsPage
 * Страница реферальной программы
 */

import { useState, useEffect } from 'react'
import { Container, Stack, Card, Button, Input } from '@/ui'
import { motion } from 'framer-motion'
import { apiFetch } from '@/shared/api/http'

interface ReferralStats {
  referral_code: string
  referrals_count: number
  total_credits_earned: number
  referral_link: string
}

interface ReferralInfo {
  email: string | null
  created_at: string
  credits_earned: number
}

function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = useState<ReferralInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadReferralData()
  }, [])

  const loadReferralData = async () => {
    try {
      const [statsData, referralsData] = await Promise.all([
        apiFetch<ReferralStats>('/referrals/my-stats'),
        apiFetch<ReferralInfo[]>('/referrals/my-referrals')
      ])
      setStats(statsData)
      setReferrals(referralsData)
    } catch (error) {
      console.error('Failed to load referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (stats?.referral_link) {
      navigator.clipboard.writeText(stats.referral_link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p>Загрузка...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <Stack gap="xl" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
            🎁 Реферальная программа
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>
            Приглашайте друзей и получайте кредиты за каждого нового пользователя
          </p>
        </motion.div>

        {/* Статистика */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card style={{ padding: '32px' }}>
            <Stack gap="lg">
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                  Ваша статистика
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                      Приглашено друзей
                    </p>
                    <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-accent-base)' }}>
                      {stats?.referrals_count || 0}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                      Заработано кредитов
                    </p>
                    <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-success-base)' }}>
                      {stats?.total_credits_earned || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                  Ваша реферальная ссылка
                </h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Input
                    value={stats?.referral_link || ''}
                    readOnly
                    style={{ flex: 1 }}
                  />
                  <Button onClick={copyToClipboard} variant="primary">
                    {copied ? '✓ Скопировано' : 'Копировать'}
                  </Button>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '12px' }}>
                  💡 За каждого друга, зарегистрировавшегося по вашей ссылке, вы получите <strong>1 кредит</strong>
                </p>
              </div>
            </Stack>
          </Card>
        </motion.div>

        {/* Список рефералов */}
        {referrals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                Приглашённые пользователи ({referrals.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {referrals.map((ref, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: 'var(--color-neutral-5)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 600 }}>
                        {ref.email || 'Пользователь Telegram'}
                      </p>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        ID: {ref.created_at}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-success-base)' }}>
                        +{ref.credits_earned} кредит
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Как это работает */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card style={{ padding: '32px', backgroundColor: 'var(--color-accent-5)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
              📚 Как это работает?
            </h2>
            <Stack gap="md">
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>1️⃣</span>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>Поделитесь ссылкой</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    Отправьте вашу реферальную ссылку друзьям, одногруппникам или коллегам
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>2️⃣</span>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>Друг регистрируется</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    Когда кто-то зарегистрируется по вашей ссылке, вы автоматически получите кредит
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>3️⃣</span>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>Используйте кредиты</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    Полученные кредиты можно использовать для создания новых работ
                  </p>
                </div>
              </div>
            </Stack>
          </Card>
        </motion.div>
      </Stack>
    </Container>
  )
}

export default ReferralsPage
