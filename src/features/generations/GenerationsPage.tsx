/**
 * GenerationsPage
 * Страница списка генераций в табличном виде
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
import styles from './GenerationsPage.module.css'

function GenerationsPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
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

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 'var(--spacing-48)' }}>
        <EmptyState
          title="Войдите через лэндинг"
          description="Для доступа к генерациям необходимо войти"
        />
      </div>
    )
  }

  return (
    <Container size="full">
      <Stack gap="xl" className={styles.container}>
        {(isLoading || hasGenerations !== false) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionTokens.duration.slow,
              ease: motionTokens.easing.out,
            }}
          >
            <div className={styles.header}>
              <div>
                <h1 className={styles.title}>Мои генерации</h1>
                <p className={styles.subtitle}>История ваших запросов и активные процессы</p>
              </div>
              <Button variant="primary" size="lg" onClick={handleNewGeneration}>
                ✨ Новая генерация
              </Button>
            </div>

            <div className={styles.searchWrapper}>
              <Input 
                placeholder="Поиск по названию..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </motion.div>
        )}

        {isLoading && hasGenerations === null && (
          <div style={{ padding: '40px 0' }}>
            <h2 style={{ color: 'var(--color-neutral-100)', fontSize: 'var(--font-size-xl)' }}>Загрузка ваших данных...</h2>
          </div>
        )}

        {!isLoading && hasGenerations === false && (
          <div style={{ paddingTop: 'var(--spacing-48)' }}>
            <FirstTimeEmptyState onCreateFirst={handleNewGeneration} />
          </div>
        )}

        <GenerationsList
          onGenerationClick={handleGenerationClick}
          onHasGenerations={handleDataLoaded}
          searchQuery={searchQuery}
        />
      </Stack>
    </Container>
  )
}

export default GenerationsPage
