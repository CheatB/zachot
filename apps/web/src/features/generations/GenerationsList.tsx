/**
 * GenerationsList component
 * Список карточек генераций
 */

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Stack, Skeleton, EmptyState } from '@/ui'
import GenerationCard from './GenerationCard'
import { mockGenerations } from './mockGenerations'
import type { Generation } from './generationTypes'

type ListState = 'loading' | 'error' | 'empty' | 'success'

interface GenerationsListProps {
  onGenerationClick?: (generation: Generation) => void
  isFirstTime?: boolean
  onEmptyAfterUsage?: () => void
  onHasGenerations?: (has: boolean) => void
}

function GenerationsList({
  onGenerationClick,
  isFirstTime = false,
  onEmptyAfterUsage,
  onHasGenerations,
}: GenerationsListProps) {
  const [state, setState] = useState<ListState>('loading')
  const [generations, setGenerations] = useState<Generation[]>([])

  useEffect(() => {
    // Симуляция загрузки
    const timer = setTimeout(() => {
      // Для демо: показываем разные состояния
      // В реальном приложении здесь будет API call
      const hasGenerations = mockGenerations.length > 0

      if (hasGenerations) {
        setGenerations(mockGenerations)
        setState('success')
        // Отмечаем, что у пользователя есть генерации
        sessionStorage.setItem('zachot_has_generations', 'true')
        onHasGenerations?.(true)
      } else {
        setState('empty')
        onHasGenerations?.(false)
        // Если не first-time и пусто, вызываем callback для empty after usage
        if (!isFirstTime && onEmptyAfterUsage) {
          onEmptyAfterUsage()
        }
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [isFirstTime, onEmptyAfterUsage, onHasGenerations])

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

  // Empty state обрабатывается в GenerationsPage
  if (state === 'empty') {
    return null
  }

  const shouldReduceMotion = useReducedMotion()

  return (
    <Stack gap="md">
      {generations.map((generation, index) => (
        <motion.div
          key={generation.id}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: motionTokens.duration.base,
            ease: motionTokens.easing.out,
            delay: shouldReduceMotion ? 0 : index * 0.06,
          }}
        >
          <GenerationCard
            generation={generation}
            onClick={() => onGenerationClick?.(generation)}
          />
        </motion.div>
      ))}
    </Stack>
  )
}

export default GenerationsList

