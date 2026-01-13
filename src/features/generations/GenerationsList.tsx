/**
 * GenerationsList component
 * Список генераций в виде аккуратной таблицы
 */

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Stack, Skeleton, EmptyState, Badge, Button } from '@/ui'
import { fetchGenerations, type Generation } from '@/shared/api/generations'
import { formatRelativeTime } from '@/utils/format'
import styles from './GenerationsPage.module.css'

type ListState = 'loading' | 'error' | 'empty' | 'success'

interface GenerationsListProps {
  onGenerationClick?: (generation: Generation) => void
  isFirstTime?: boolean
  onEmptyAfterUsage?: () => void
  onHasGenerations?: (has: boolean) => void
  searchQuery?: string
}

// Map work types to credit costs (matching packages/billing/credits.py)
const CREDIT_COSTS: Record<string, number> = {
  referat: 1,
  essay: 1,
  doklad: 1,
  composition: 1,
  article: 2,
  presentation: 1,
  kursach: 3,
  other: 2,
};

function GenerationsList({
  onGenerationClick,
  isFirstTime = false,
  onEmptyAfterUsage,
  onHasGenerations,
  searchQuery = '',
}: GenerationsListProps) {
  const [state, setState] = useState<ListState>('loading')
  const [generations, setGenerations] = useState<Generation[]>([])
  
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

  const getStatusBadge = (s: string) => {
    const status = (s || '').toUpperCase()
    switch (status) {
      case 'COMPLETED':
      case 'GENERATED':
      case 'EXPORTED': return <Badge status="success">Завершено</Badge>
      case 'RUNNING': return <Badge status="warn">В процессе</Badge>
      case 'WAITING_USER': return <Badge status="warn">Ожидает вас</Badge>
      case 'FAILED': return <Badge status="danger">Ошибка</Badge>
      case 'DRAFT': return <Badge status="neutral">Черновик</Badge>
      default: return <Badge status="neutral">{status}</Badge>
    }
  }

  const getModuleLabel = (module: string): string => {
    switch (module.toUpperCase()) {
      case 'TEXT': return 'Текст'
      case 'PRESENTATION': return 'Презентация'
      case 'TASK': return 'Задачи'
      case 'GOST_FORMAT': return 'Оформление'
      default: return module
    }
  }

  const getCreditCost = (gen: Generation): number => {
    if (gen.module === 'PRESENTATION') return 1;
    if (gen.module === 'GOST_FORMAT') return 1;
    return CREDIT_COSTS[gen.work_type || 'other'] || 2;
  }

  const getActionLabel = (s: string): string => {
    const status = (s || '').toUpperCase()
    if (status === 'DRAFT' || status === 'WAITING_USER') return 'Продолжить'
    if (status === 'RUNNING') return 'Открыть'
    return 'Результат'
  }

  if (state === 'loading') {
    return (
      <Stack gap="md">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width="100%" height="60px" />
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

  if (state === 'empty') return null

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Название</th>
            <th>Стоимость</th>
            <th>Статус</th>
            <th>Изменено</th>
            <th className={styles.actionCell}>Действие</th>
          </tr>
        </thead>
        <tbody>
          {filteredGenerations.map((gen, index) => (
            <motion.tr 
              key={gen.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <td>
                <div className={styles.genTitle}>{gen.title || 'Без названия'}</div>
                <div className={styles.genModule}>{getModuleLabel(gen.module)}</div>
              </td>
              <td>
                <div className={styles.credits}>
                  <span className={styles.creditsIcon}>💎</span>
                  {getCreditCost(gen)}
                </div>
              </td>
              <td>{getStatusBadge(gen.status)}</td>
              <td>
                <span className={styles.date}>{formatRelativeTime(gen.updated_at)}</span>
              </td>
              <td className={styles.actionCell}>
                <Button 
                  variant={gen.status === 'DRAFT' || gen.status === 'WAITING_USER' ? 'primary' : 'secondary'} 
                  size="sm"
                  onClick={() => onGenerationClick?.(gen)}
                >
                  {getActionLabel(gen.status)}
                </Button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default GenerationsList
