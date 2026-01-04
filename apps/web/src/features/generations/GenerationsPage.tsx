/**
 * GenerationsPage
 * Страница списка генераций
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import AppShell from '@/app/layout/AppShell'
import { Container, Stack, Button, EmptyState, Tooltip } from '@/ui'
import GenerationsList from './GenerationsList'
import FirstTimeEmptyState from './FirstTimeEmptyState'
import EmptyAfterUsageState from './EmptyAfterUsageState'
import type { Generation } from './generationTypes'

const FIRST_TIME_KEY = 'zachot_first_time'
const HAS_GENERATIONS_KEY = 'zachot_has_generations'

function GenerationsPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [showEmptyAfterUsage, setShowEmptyAfterUsage] = useState(false)
  const [hasGenerations, setHasGenerations] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Проверка first-time при монтировании
  useEffect(() => {
    if (!isAuthenticated) return

    const firstTimeFlag = sessionStorage.getItem(FIRST_TIME_KEY)
    const hasGenerationsFlag = sessionStorage.getItem(HAS_GENERATIONS_KEY)

    // Если флаг first-time не установлен, это первый вход
    if (firstTimeFlag === null) {
      setIsFirstTime(true)
      sessionStorage.setItem(FIRST_TIME_KEY, 'true')
    }

    // Если были генерации ранее, но сейчас список пуст
    if (hasGenerationsFlag === 'true') {
      setShowEmptyAfterUsage(true)
    }

    setIsLoading(false)
  }, [isAuthenticated])

  const handleGenerationClick = (generation: Generation) => {
    // Навигация к странице генерации
    // Если running → показываем progress page
    if (generation.status === 'running') {
      navigate(`/generations/${generation.id}`)
    } else {
      // TODO: Для других статусов будет детальная страница
      navigate(`/generations/${generation.id}`)
    }
  }

  const handleNewGeneration = () => {
    navigate('/generations/new')
  }

  const handleCreateFirst = () => {
    // При создании первой генерации снимаем first-time флаг
    sessionStorage.setItem(FIRST_TIME_KEY, 'false')
    sessionStorage.setItem(HAS_GENERATIONS_KEY, 'true')
    setIsFirstTime(false)
    navigate('/generations/new')
  }

  const handleEmptyAfterUsage = () => {
    setHasGenerations(false)
  }

  if (!isAuthenticated) {
    return (
      <AppShell>
        <EmptyState
          title="Войдите через лэндинг"
          description="Для доступа к генерациям необходимо войти"
        />
      </AppShell>
    )
  }

  if (isLoading) {
    return (
      <AppShell>
        <Container size="lg">
          <Stack gap="xl">
            <div>
              <h1
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  marginBottom: 'var(--spacing-12)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Мои генерации
              </h1>
            </div>
          </Stack>
        </Container>
      </AppShell>
    )
  }

  // First-time empty state (показывается только если нет генераций и это first-time)
  if (isFirstTime && !hasGenerations) {
    return (
      <AppShell>
        <Container size="lg">
          <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
            <FirstTimeEmptyState onCreateFirst={handleCreateFirst} />
          </Stack>
        </Container>
      </AppShell>
    )
  }

  // Empty after usage state (показывается если были генерации, но сейчас нет)
  if (showEmptyAfterUsage && !hasGenerations) {
    return (
      <AppShell>
        <Container size="lg">
          <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
            <EmptyAfterUsageState onCreateNew={handleNewGeneration} />
          </Stack>
        </Container>
      </AppShell>
    )
  }

  const shouldReduceMotion = useReducedMotion()

  // Normal state with generations
  return (
    <AppShell>
      <Container size="lg">
        <Stack gap="xl">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
            }}
          >
            <h1
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                marginBottom: 'var(--spacing-12)',
                color: 'var(--color-text-primary)',
              }}
            >
              Мои генерации
            </h1>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-relaxed)',
              }}
            >
              Все ваши запросы и их состояние
            </p>
          </motion.div>

          <motion.div
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)' }}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionTokens.duration.base,
              ease: motionTokens.easing.out,
              delay: shouldReduceMotion ? 0 : 0.1,
            }}
          >
            <Button variant="primary" onClick={handleNewGeneration}>
              Новая генерация
            </Button>
            <Tooltip content="Вы сможете вернуться к результату позже">
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                ℹ️
              </span>
            </Tooltip>
          </motion.div>

          <GenerationsList
            onGenerationClick={handleGenerationClick}
            isFirstTime={isFirstTime}
            onEmptyAfterUsage={handleEmptyAfterUsage}
            onHasGenerations={(has) => setHasGenerations(has)}
          />
        </Stack>
      </Container>
    </AppShell>
  )
}

export default GenerationsPage

