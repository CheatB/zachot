/**
 * GenerationRecoveryPage
 * Страница восстановления или пересборки генерации
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import { Container, Stack, Button, Card, Badge, EmptyState } from '@/ui'
import { getGenerationById, createGeneration, type Generation } from '@/shared/api/generations'

function GenerationRecoveryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRecovering, setIsRecovering] = useState(false)

  useEffect(() => {
    if (!id || !isAuthenticated) return

    getGenerationById(id)
      .then(setGeneration)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, isAuthenticated])

  const handleRestart = async () => {
    if (!generation) return
    
    setIsRecovering(true)
    try {
      // Convert numeric humanity level to string if needed
      const humanityLevel = typeof generation.humanity_level === 'number'
        ? (generation.humanity_level < 20 ? 'low' : generation.humanity_level <= 70 ? 'medium' : 'high')
        : (generation.humanity_level || 'medium')
      
      // Создаем новую генерацию на основе старых данных (пересборка)
      const newGen = await createGeneration({
        module: generation.module,
        work_type: generation.work_type,
        complexity_level: generation.complexity_level,
        humanity_level: humanityLevel,
        input_payload: generation.input_payload,
        settings_payload: generation.settings_payload,
      })
      navigate(`/generations/${newGen.id}`)
    } catch (error) {
      console.error('Failed to restart generation:', error)
      setIsRecovering(false)
    }
  }

  if (loading) {
    return (
      <Container size="lg">
        <p style={{ textAlign: 'center', paddingTop: 100 }}>Загрузка данных для восстановления...</p>
      </Container>
    )
  }

  if (!generation) {
    return (
      <EmptyState title="Работа не найдена" description="Не удается найти данные для восстановления." />
    )
  }

  return (
    <Container size="lg">
      <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionTokens.duration.base, ease: motionTokens.easing.out }}
        >
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-12)' }}>
            Восстановление работы
          </h1>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
            Вы можете перезапустить процесс генерации с теми же параметрами или изменить их.
          </p>
        </motion.div>

        <Card>
          <div style={{ padding: 'var(--spacing-24)' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-16)' }}>
              Параметры исходной работы
            </h3>
            <Stack gap="md">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Тема</span>
                <span style={{ fontWeight: 'var(--font-weight-medium)', maxWidth: '60%', textAlign: 'right' }}>
                  {generation.title || 'Без названия'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Тип</span>
                <Badge status="neutral">{generation.work_type || generation.module}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Сложность</span>
                <span>{generation.complexity_level}</span>
              </div>
            </Stack>
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 'var(--spacing-16)' }}>
          <Button variant="primary" onClick={handleRestart} loading={isRecovering} disabled={isRecovering}>
            Перезапустить генерацию
          </Button>
          <Button variant="secondary" onClick={() => navigate('/generations')} disabled={isRecovering}>
            Отмена
          </Button>
        </div>
      </Stack>
    </Container>
  )
}

export default GenerationRecoveryPage
