/**
 * ReferralsPage
 * Страница реферальной программы
 */

import { useState, useEffect } from 'react'
import { Container, Stack, Button, Card, Badge } from '@/ui'
import { useAuth } from '@/app/auth/useAuth'
import { useToast } from '@/ui/primitives/Toast'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'

interface ReferralInfo {
  referral_code: string
  referrals_count: number
  credits_earned: number
}

function ReferralsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Загружаем реферальные данные
    const loadReferralInfo = async () => {
      try {
        const token = localStorage.getItem('zachot_auth_token')
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/me/referral-info`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setReferralInfo(data)
        }
      } catch (error) {
        console.error('Failed to load referral info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id) {
      loadReferralInfo()
    }
  }, [user])

  const handleCopyLink = () => {
    if (!referralInfo?.referral_code) return
    
    const referralLink = `https://app.zachet.tech/?ref=${referralInfo.referral_code}`
    navigator.clipboard.writeText(referralLink)
    showToast('Реферальная ссылка скопирована в буфер обмена', 'success')
  }

  const handleCopyCode = () => {
    if (!referralInfo?.referral_code) return
    
    navigator.clipboard.writeText(referralInfo.referral_code)
    showToast('Реферальный код скопирован', 'success')
  }

  if (isLoading) {
    return (
      <Container size="lg">
        <div style={{ padding: 'var(--spacing-48)', textAlign: 'center' }}>
          <h2>Загрузка...</h2>
        </div>
      </Container>
    )
  }

  return (
    <Container size="lg">
      <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-64)' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: motionTokens.duration.slow,
            ease: motionTokens.easing.out,
          }}
        >
          <h1 style={{ 
            fontSize: 'var(--font-size-2xl)', 
            marginBottom: 'var(--spacing-8)',
            color: 'var(--color-neutral-100)'
          }}>
            🎁 Реферальная программа
          </h1>
          <p style={{ 
            fontSize: 'var(--font-size-base)', 
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-relaxed)'
          }}>
            Приглашайте друзей и получайте бонусные кредиты за каждого нового пользователя
          </p>
        </motion.div>

        <Card style={{ padding: 'var(--spacing-32)' }}>
          <Stack gap="xl">
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-16)', fontSize: 'var(--font-size-lg)' }}>
                Ваша реферальная ссылка
              </h3>
              <div style={{ 
                padding: 'var(--spacing-16)', 
                background: 'var(--color-neutral-5)', 
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--spacing-16)',
                flexWrap: 'wrap'
              }}>
                <code style={{ 
                  fontSize: 'var(--font-size-sm)',
                  wordBreak: 'break-all',
                  flex: 1
                }}>
                  https://app.zachet.tech/?ref={referralInfo?.referral_code || '...'}
                </code>
                <Button 
                  variant="primary" 
                  size="md" 
                  onClick={handleCopyLink}
                  disabled={!referralInfo?.referral_code}
                >
                  📋 Копировать ссылку
                </Button>
              </div>
              
              <div style={{ marginTop: 'var(--spacing-12)' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-8)' }}>
                  Или поделитесь кодом:
                </p>
                <div style={{ 
                  display: 'flex', 
                  gap: 'var(--spacing-12)', 
                  alignItems: 'center' 
                }}>
                  <Badge status="neutral" style={{ fontSize: '16px', padding: '8px 16px' }}>
                    {referralInfo?.referral_code || '...'}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCopyCode}
                    disabled={!referralInfo?.referral_code}
                  >
                    Копировать код
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: 'var(--spacing-16)', fontSize: 'var(--font-size-lg)' }}>
                Ваша статистика
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 'var(--spacing-16)' 
              }}>
                <div style={{ 
                  padding: 'var(--spacing-20)', 
                  background: 'var(--color-neutral-5)', 
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-neutral-100)' }}>
                    {referralInfo?.referrals_count || 0}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-4)' }}>
                    Приглашено друзей
                  </div>
                </div>
                
                <div style={{ 
                  padding: 'var(--spacing-20)', 
                  background: 'var(--color-accent-light)', 
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                  border: '1px solid var(--color-accent-base)'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-accent-base)' }}>
                    {referralInfo?.credits_earned || 0} 💎
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-4)' }}>
                    Заработано кредитов
                  </div>
                </div>
              </div>
            </div>

            <div style={{ 
              padding: 'var(--spacing-24)', 
              background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%)', 
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-accent-base)'
            }}>
              <h4 style={{ 
                marginBottom: 'var(--spacing-12)', 
                color: 'var(--color-accent-base)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'bold'
              }}>
                💡 Как это работает?
              </h4>
              <Stack gap="sm">
                <div style={{ display: 'flex', gap: 'var(--spacing-12)', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px' }}>1️⃣</span>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                    Поделитесь своей реферальной ссылкой с другом
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-12)', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px' }}>2️⃣</span>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                    Друг регистрируется по вашей ссылке и создает первую работу
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-12)', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px' }}>3️⃣</span>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                    <strong>Вы получаете +1 кредит</strong> на свой счет автоматически
                  </p>
                </div>
              </Stack>
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

export default ReferralsPage
