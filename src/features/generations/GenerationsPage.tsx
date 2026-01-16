/**
 * GenerationsPage
 * Страница списка генераций в табличном виде
 * 
 * Использует React Query для автоматического кэширования и обновления данных.
 */

import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import { Container, Stack, Button, EmptyState, Input } from '@/ui'
import GenerationsList from './GenerationsList'
import FirstTimeEmptyState from './FirstTimeEmptyState'
import { type Generation } from '@/shared/api/generations'
import { useGenerations } from '@/shared/api/queries/generations'
import styles from './GenerationsPage.module.css'

function GenerationsPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  
  // React Query автоматически управляет загрузкой, кэшированием и ошибками
  const { data, isLoading, error } = useGenerations()
  
  // Фильтруем генерации по поисковому запросу
  const filteredGenerations = useMemo(() => {
    if (!data?.items) return []
    if (!searchQuery.trim()) return data.items
    
    const query = searchQuery.toLowerCase()
    return data.items.filter(gen => 
      gen.title?.toLowerCase().includes(query) ||
      gen.work_type?.toLowerCase().includes(query)
    )
  }, [data?.items, searchQuery])
  
  const hasGenerations = data?.items && data.items.length > 0

  const handleGenerationClick = useCallback((generation: Generation) => {
    const status = (generation.status as string).toUpperCase()
    if (status === 'DRAFT') {
      navigate(`/?draftId=${generation.id}`)
    } else if (status === 'RUNNING') {
      navigate(`/generations/${generation.id}`)
    } else {
      // Для TEXT генераций открываем редактор, для остальных - результат
      if (generation.module === 'TEXT') {
        navigate(`/generations/${generation.id}/editor`)
      } else {
      navigate(`/generations/${generation.id}/result`)
      }
    }
  }, [navigate])

  const handleNewGeneration = useCallback(() => {
    navigate('/')
  }, [navigate])

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

  // Обработка ошибки загрузки
  if (error) {
    return (
      <Container size="full">
        <div style={{ padding: 'var(--spacing-48)' }}>
          <EmptyState
            title="Ошибка загрузки"
            description="Не удалось загрузить список генераций. Попробуйте обновить страницу."
          />
        </div>
      </Container>
    )
  }

  return (
    <Container size="full">
      <Stack gap="xl" className={styles.container}>
        {(isLoading || hasGenerations) && (
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

        {isLoading && (
          <div style={{ padding: '40px 0' }}>
            <h2 style={{ color: 'var(--color-neutral-100)', fontSize: 'var(--font-size-xl)' }}>Загрузка ваших данных...</h2>
          </div>
        )}

        {!isLoading && !hasGenerations && (
          <div style={{ paddingTop: 'var(--spacing-48)' }}>
            <FirstTimeEmptyState onCreateFirst={handleNewGeneration} />
          </div>
        )}

        {!isLoading && hasGenerations && (
          <GenerationsList
            generations={filteredGenerations}
            onGenerationClick={handleGenerationClick}
          />
        )}
      </Stack>
    </Container>
  )
}

export default GenerationsPage
