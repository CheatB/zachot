/**
 * GenerationsPage
 * Страница списка генераций
 * Updated for "juicy" landing page feel
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import AppShell from '@/app/layout/AppShell'
import { Container, Stack, Button, EmptyState, Input } from '@/ui'
import GenerationsList from './GenerationsList'
import FirstTimeEmptyState from './FirstTimeEmptyState'
import EmptyAfterUsageState from './EmptyAfterUsageState'
import { type Generation } from '@/shared/api/generations'

const FIRST_TIME_KEY = 'zachot_first_time'
const HAS_GENERATIONS_KEY = 'zachot_has_generations'

function GenerationsPage() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const shouldReduceMotion = false
  
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [showEmptyAfterUsage, setShowEmptyAfterUsage] = useState(false)
  const [hasGenerations, setHasGenerations] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return

    const firstTimeFlag = sessionStorage.getItem(FIRST_TIME_KEY)
    const hasGenerationsFlag = sessionStorage.getItem(HAS_GENERATIONS_KEY)

    if (firstTimeFlag === null) {
      setIsFirstTime(true)
      sessionStorage.setItem(FIRST_TIME_KEY, 'true')
    }

    if (hasGenerationsFlag === 'true') {
      setShowEmptyAfterUsage(true)
    }

    setIsLoading(false)
  }, [isAuthenticated])

  const handleGenerationClick = (generation: Generation) => {
    if (generation.status === 'running') {
      navigate(`/generations/${generation.id}`)
    } else {
      navigate(`/generations/${generation.id}/result`)
    }
  }

  const handleNewGeneration = () => {
    navigate('/')
  }

  const handleCreateFirst = () => {
    sessionStorage.setItem(FIRST_TIME_KEY, 'false')
    sessionStorage.setItem(HAS_GENERATIONS_KEY, 'true')
    setIsFirstTime(false)
    navigate('/')
  }

  const handleEmptyAfterUsage = () => {
    setHasGenerations(false)
  }

  return (
    <AppShell isAuthenticated={isAuthenticated} user={user}>
      {isAuthenticated ? (
        isLoading ? (
          <Container size="lg">
            <Stack gap="xl">
              <div>
                <h1 style={{ color: 'var(--color-neutral-100)' }}>Загрузка...</h1>
              </div>
            </Stack>
          </Container>
        ) : isFirstTime && !hasGenerations ? (
          <Container size="lg">
            <Stack gap="xl" style={{ paddingTop: 'var(--spacing-48)', paddingBottom: 'var(--spacing-48)' }}>
              <FirstTimeEmptyState onCreateFirst={handleCreateFirst} />
            </Stack>
          </Container>
        ) : showEmptyAfterUsage && !hasGenerations ? (
          <Container size="lg">
            <Stack gap="xl" style={{ paddingTop: 'var(--spacing-48)', paddingBottom: 'var(--spacing-48)' }}>
              <EmptyAfterUsageState onCreateNew={handleNewGeneration} />
            </Stack>
          </Container>
        ) : (
          <Container size="lg">
            <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)' }}>
              <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: motionTokens.duration.slow,
                  ease: motionTokens.easing.out,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-24)', gap: 'var(--spacing-24)', flexWrap: 'wrap' }}>
                  <div>
                    <h1 style={{ marginBottom: 'var(--spacing-12)', color: 'var(--color-neutral-100)' }}>
                      Мои генерации
                    </h1>
                    <p style={{ 
                      fontSize: 'var(--font-size-lg)', 
                      color: 'var(--color-text-secondary)',
                      maxWidth: '600px',
                      margin: 0
                    }}>
                      История ваших запросов и активные процессы
                    </p>
                  </div>
                  <Button variant="primary" size="lg" onClick={handleNewGeneration}>
                    ✨ Новая генерация
                  </Button>
                </div>

                <div style={{ marginBottom: 'var(--spacing-32)' }}>
                  <Input 
                    placeholder="Поиск по названию..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                      maxWidth: '480px',
                      boxShadow: 'var(--elevation-1)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  />
                </div>
              </motion.div>

              <GenerationsList
                onGenerationClick={handleGenerationClick}
                isFirstTime={isFirstTime}
                onEmptyAfterUsage={handleEmptyAfterUsage}
                onHasGenerations={(has) => setHasGenerations(has)}
                searchQuery={searchQuery}
              />
            </Stack>
          </Container>
        )
      ) : (
        <EmptyState
          title="Войдите через лэндинг"
          description="Для доступа к генерациям необходимо войти"
        />
      )}
    </AppShell>
  )
}

export default GenerationsPage
