/**
 * GenerationsPage
 * Страница списка генераций
 * Updated for "juicy" landing page feel
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import { Container, Stack, Button, EmptyState, Input } from '@/ui'
import GenerationsList from './GenerationsList'
import FirstTimeEmptyState from './FirstTimeEmptyState'
import { type Generation } from '@/shared/api/generations'

function GenerationsPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const shouldReduceMotion = false
  
  // Состояния для управления пустыми экранами
  const [hasGenerations, setHasGenerations] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const handleGenerationClick = useCallback((generation: Generation) => {
    const status = (generation.status as string).toUpperCase()
    if (status === 'DRAFT') {
      navigate(`/?draftId=${generation.id}`)
    } else if (status === 'RUNNING') {
      navigate(`/generations/${generation.id}`)
    } else {
      navigate(`/generations/${generation.id}/result`)
    }
  }, [navigate])

  const handleNewGeneration = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleDataLoaded = useCallback((hasData: boolean) => {
    setHasGenerations(hasData)
    setIsLoading(false)
  }, [])

  return (
    <>
      {isAuthenticated ? (
        isLoading ? (
          <Container size="lg">
            <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)' }}>
              <h1 style={{ color: 'var(--color-neutral-100)', fontSize: 'var(--font-size-2xl)' }}>Загрузка...</h1>
            </Stack>
          </Container>
        ) : hasGenerations === false ? (
          <Container size="lg">
            <Stack gap="xl" style={{ paddingTop: 'var(--spacing-48)', paddingBottom: 'var(--spacing-48)' }}>
              <FirstTimeEmptyState onCreateFirst={handleNewGeneration} />
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
                    <h1 style={{ marginBottom: 'var(--spacing-12)', color: 'var(--color-neutral-100)', fontSize: 'var(--font-size-2xl)' }}>
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
                onHasGenerations={handleDataLoaded}
                searchQuery={searchQuery}
              />
            </Stack>
          </Container>
        )
      ) : (
        <div style={{ padding: 'var(--spacing-48)' }}>
          <EmptyState
            title="Войдите через лэндинг"
            description="Для доступа к генерациям необходимо войти"
          />
        </div>
      )}
    </>
  )
}

export default GenerationsPage
