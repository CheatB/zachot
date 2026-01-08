/**
 * GenerationsList component
 * Список карточек генераций с разделением на активные и историю
 */

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Stack, Skeleton, EmptyState } from '@/ui'
import GenerationCard from './GenerationCard'
import { fetchGenerations, type Generation } from '@/shared/api/generations'

type ListState = 'loading' | 'error' | 'empty' | 'success'

interface GenerationsListProps {
  onGenerationClick?: (generation: Generation) => void
  isFirstTime?: boolean
  onEmptyAfterUsage?: () => void
  onHasGenerations?: (has: boolean) => void
  searchQuery?: string
}

function GenerationsList({
  onGenerationClick,
  isFirstTime = false,
  onEmptyAfterUsage,
  onHasGenerations,
  searchQuery = '',
}: GenerationsListProps) {
  const [state, setState] = useState<ListState>('loading')
  const [generations, setGenerations] = useState<Generation[]>([])
  
  // Use a ref to prevent multiple calls to onHasGenerations with the same value
  const reportedHasData = useRef<boolean | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const response = await fetchGenerations()
        if (!isMounted) return

        if (response.items && response.items.length > 0) {
          setGenerations(response.items)
          setState('success')
          
          if (reportedHasData.current !== true) {
            reportedHasData.current = true
            onHasGenerations?.(true)
          }
        } else {
          setState('empty')
          
          if (reportedHasData.current !== false) {
            reportedHasData.current = false
            onHasGenerations?.(false)
          }
          
          if (!isFirstTime && onEmptyAfterUsage) {
            onEmptyAfterUsage()
          }
        }
      } catch (error) {
        if (!isMounted) return
        console.error('Failed to fetch generations:', error)
        setState('error')
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [isFirstTime, onEmptyAfterUsage, onHasGenerations])

  const filteredGenerations = generations.filter(g => 
    (g.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeGenerations = filteredGenerations.filter(g => {
    const status = (g.status as string).toUpperCase()
    return status === 'RUNNING' || status === 'DRAFT' || status === 'WAITING_USER'
  })
  
  const historyGenerations = filteredGenerations.filter(g => {
    const status = (g.status as string).toUpperCase()
    return status !== 'RUNNING' && status !== 'DRAFT' && status !== 'WAITING_USER'
  })

  if (state === 'loading') {
    return (
      <Stack gap="md">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width="100%" height="120px" />
        ))}
      </Stack>
    )
  }

  if (state === 'error') {
    return (
      <EmptyState
        title="Не удалось загрузить генерации"
        description="Попробуйте обновить страницу. Если проблема сохраняется, обратитесь в поддержку"
      />
    )
  }

  if (state === 'empty') {
    return null
  }

  return (
    <Stack gap="xl">
      {activeGenerations.length > 0 && (
        <Stack gap="md">
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}>
            В работе
          </h2>
          <Stack gap="md">
            {activeGenerations.map((generation, index) => (
              <motion.div
                key={generation.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: motionTokens.duration.base,
                  ease: motionTokens.easing.out,
                  delay: index * 0.06,
                }}
              >
                <GenerationCard
                  generation={generation}
                  onClick={() => onGenerationClick?.(generation)}
                />
              </motion.div>
            ))}
          </Stack>
        </Stack>
      )}

      {historyGenerations.length > 0 && (
        <Stack gap="md">
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}>
            История
          </h2>
          <Stack gap="md">
            {historyGenerations.map((generation, index) => (
              <motion.div
                key={generation.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: motionTokens.duration.base,
                  ease: motionTokens.easing.out,
                  delay: (activeGenerations.length + index) * 0.06,
                }}
              >
                <GenerationCard
                  generation={generation}
                  onClick={() => onGenerationClick?.(generation)}
                />
              </motion.div>
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}

export default GenerationsList
