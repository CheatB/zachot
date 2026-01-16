/**
 * GenerationsList component
 * Список генераций в виде аккуратной таблицы
 * 
 * Теперь получает данные через пропсы (управляется React Query в родителе).
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Stack, Badge, Button } from '@/ui'
import { type Generation } from '@/shared/api/generations'
import { useDeleteGeneration } from '@/shared/api/queries/generations'
import { formatRelativeTime } from '@/utils/format'
import { useToast } from '@/ui/primitives/Toast'
import styles from './GenerationsPage.module.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface GenerationsListProps {
  generations: Generation[]
  onGenerationClick?: (generation: Generation) => void
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
}

function GenerationsList({
  generations,
  onGenerationClick,
}: GenerationsListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const { showToast } = useToast()
  
  // React Query hook для удаления
  const deleteGenerationMutation = useDeleteGeneration()

  const handleDelete = async (e: React.MouseEvent, generationId: string) => {
    e.stopPropagation()
    
    if (!confirm('Вы уверены, что хотите удалить эту генерацию?')) {
      return
    }

    try {
      await deleteGenerationMutation.mutateAsync(generationId)
      showToast('Генерация удалена', 'success')
    } catch (error) {
      console.error('Failed to delete generation:', error)
      showToast('Ошибка при удалении', 'error')
    }
  }

  const handleDownload = (e: React.MouseEvent, generationId: string, format: 'docx' | 'pdf') => {
    e.stopPropagation()
    const token = localStorage.getItem('auth_token')
    const url = `${API_BASE_URL}/api/generations/${generationId}/export/${format}`
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Download failed')
        return response.blob()
      })
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `generation-${generationId}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
        showToast(`Файл ${format.toUpperCase()} скачан`, 'success')
      })
      .catch(error => {
        console.error('Download error:', error)
        showToast('Ошибка при скачивании', 'error')
      })
  }

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase()
    
    switch (statusUpper) {
      case 'DRAFT':
        return <Badge status="neutral">Черновик</Badge>
      case 'PENDING':
      case 'RUNNING':
        return <Badge status="warn">В процессе</Badge>
      case 'COMPLETED':
      case 'GENERATED':
      case 'EXPORTED':
        return <Badge status="success">Готово</Badge>
      case 'FAILED':
        return <Badge status="danger">Ошибка</Badge>
      case 'CANCELED':
        return <Badge status="neutral">Отменено</Badge>
      default:
        return <Badge status="neutral">{status}</Badge>
    }
  }

  const getWorkTypeLabel = (workType: string | null | undefined): string => {
    if (!workType) return 'Другое'
    
    const labels: Record<string, string> = {
      referat: 'Реферат',
      essay: 'Эссе',
      doklad: 'Доклад',
      composition: 'Сочинение',
      article: 'Статья',
      presentation: 'Презентация',
      kursach: 'Курсовая',
      other: 'Другое',
    }
    
    return labels[workType] || workType
  }

  const getCreditCost = (workType: string | null | undefined): number => {
    if (!workType) return 2
    return CREDIT_COSTS[workType] || 2
  }

  // Pagination
  const totalPages = Math.ceil(generations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentGenerations = generations.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (generations.length === 0) {
    return null
  }

  return (
    <Stack gap="lg">
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Тип</th>
              <th>Статус</th>
              <th>Создано</th>
              <th>Кредиты</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {currentGenerations.map((generation, index) => (
              <motion.tr
                key={generation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onGenerationClick?.(generation)}
                className={styles.tableRow}
              >
                <td className={styles.titleCell}>
                  <div className={styles.titleWrapper}>
                    <span className={styles.titleText}>{generation.title || 'Без названия'}</span>
                  </div>
                </td>
                <td>{getWorkTypeLabel(generation.work_type)}</td>
                <td>{getStatusBadge(generation.status)}</td>
                <td className={styles.dateCell}>
                  {formatRelativeTime(generation.created_at)}
                </td>
                <td className={styles.creditsCell}>
                  {getCreditCost(generation.work_type)} 💎
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actions}>
                    {(generation.status === 'COMPLETED' || generation.status === 'GENERATED' || generation.status === 'EXPORTED') && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDownload(e, generation.id, 'docx')}
                        >
                          DOCX
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDownload(e, generation.id, 'pdf')}
                        >
                          PDF
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(e, generation.id)}
                      disabled={deleteGenerationMutation.isPending}
                    >
                      🗑️
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Назад
          </Button>
          
          <span className={styles.pageInfo}>
            Страница {currentPage} из {totalPages}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Вперёд →
          </Button>
        </div>
      )}
    </Stack>
  )
}

export default GenerationsList
