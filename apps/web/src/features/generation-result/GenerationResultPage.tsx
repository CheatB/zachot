/**
 * GenerationResultPage
 * Экран результата генерации (Completed / Failed)
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { useAuth } from '@/app/auth/useAuth'
import { Container, Stack, Button, Badge, EmptyState, Card } from '@/ui'
import ResultContent from './ResultContent'
import ResultActions from './ResultActions'
import ResultMeta from './ResultMeta'
import DegradedBanner from './DegradedBanner'
import PresentationPreview from './PresentationPreview'
import TutorSection from './TutorSection'
import VisualUpsellCard from './VisualUpsellCard'
import { getGenerationById, type Generation } from '@/shared/api/generations'
import { formatRelativeTime } from '@/utils/format'
import { ENV } from '@/shared/config/env'
import { useToast } from '@/ui/primitives/Toast'

function GenerationResultPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDegraded] = useState(id?.includes('degraded') || false)

  useEffect(() => {
    if (!id || !isAuthenticated) return

    getGenerationById(id)
      .then(setGeneration)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, isAuthenticated])

  const handleCopy = () => {
    if (generation?.result_content) {
      navigator.clipboard.writeText(generation.result_content)
      showToast('Текст скопирован в буфер обмена', 'success')
    }
  }

  const handleNewGeneration = () => {
    navigate('/')
  }

  const handleBackToList = () => {
    navigate('/generations')
  }

  const handleRetry = () => {
    navigate('/')
  }

  const handleExport = (format: 'docx' | 'pdf' | 'pptx') => {
    if (!id) return;
    const url = `${ENV.API_BASE_URL}/generations/${id}/export/${format}`;
    const link = document.body.appendChild(document.createElement('a'));
    link.href = url;
    link.setAttribute('download', `zachet_${id}.${format}`);
    link.click();
    link.parentNode?.removeChild(link);
  }

  if (loading) {
    return (
      <Container size="lg">
        <p style={{ textAlign: 'center', paddingTop: 100 }}>Загрузка результата...</p>
      </Container>
    )
  }

  if (!generation) {
    return (
      <EmptyState title="Результат не найден" description="Возможно, работа была удалена." />
    )
  }

  return (
    <>
      {isAuthenticated ? (
        generation.status === 'FAILED' ? (
          <Container size="lg">
            <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: motionTokens.duration.base,
                  ease: motionTokens.easing.out,
                }}
              >
                <div className="result-header">
                  <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-12)' }}>
                    Не удалось завершить генерацию
                  </h1>
                  <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)', marginBottom: 'var(--spacing-24)' }}>
                    Иногда такое случается. Мы уже знаем об ошибке и работаем над её исправлением.
                  </p>
                </div>
              </motion.div>

              <Card>
                <div style={{ padding: 'var(--spacing-24)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-12)' }}>
                    Что можно сделать?
                  </h3>
                  <Stack gap="sm">
                    <p>• Попробуйте создать генерацию ещё раз</p>
                    <p>• Проверьте, что введённый материал корректен</p>
                    <p>• Если проблема повторяется, обратитесь в поддержку</p>
                  </Stack>
                </div>
              </Card>

              <div className="result-actions">
                <Button variant="primary" onClick={handleRetry}>Попробовать ещё раз</Button>
                <Button variant="secondary" onClick={handleBackToList}>Вернуться к списку</Button>
              </div>
            </Stack>
          </Container>
        ) : (
          <Container size="lg">
            <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: motionTokens.duration.base,
                  ease: motionTokens.easing.out,
                }}
              >
                <div className="result-header">
                  <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-12)' }}>
                    Готово
                  </h1>
                  <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)', marginBottom: 'var(--spacing-12)' }}>
                    Материал успешно структурирован и готов к использованию
                  </p>
                  <div className="result-header__meta" style={{ display: 'flex', gap: 'var(--spacing-16)', alignItems: 'center' }}>
                    <Badge status="success">Завершено</Badge>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      Обновлено {formatRelativeTime(generation.updated_at)}
                    </span>
                  </div>
                </div>
              </motion.div>

              {isDegraded && <DegradedBanner onContinue={() => {}} onNewGeneration={handleNewGeneration} />}

              {generation.module === 'PRESENTATION' && generation.result_content && (
                <>
                  <PresentationPreview content={generation.result_content} style={generation.input_payload.presentation_style || 'academic'} />
                  <VisualUpsellCard 
                    suggestions={generation.settings_payload.visual_upsell_suggestions || [
                      { slideId: 1, description: 'Футуристичная обложка по теме работы', style: '3D Render' },
                      { slideId: 3, description: 'Инфографика процессов на темном фоне', style: 'Minimalist' },
                      { slideId: 7, description: 'Абстрактный фон для выводов', style: 'Soft Gradient' },
                    ]}
                    onApprove={() => showToast('Функция оплаты будет добавлена в следующем обновлении', 'info')}
                  />
                </>
              )}

              {generation.module === 'TASK' && generation.input_payload.task_mode === 'step-by-step' && (
                <TutorSection generationId={generation.id} />
              )}

              {generation.result_content && (
                <ResultContent 
                  content={generation.result_content} 
                  type={generation.module} 
                  onUpdate={(updated) => setGeneration(updated)}
                />
              )}

              <ResultActions
                onCopy={handleCopy}
                onNewGeneration={handleNewGeneration}
                onBackToList={handleBackToList}
                onExport={handleExport}
              />

              <ResultMeta type={generation.module} durationSeconds={120} />
            </Stack>
          </Container>
        )
      ) : (
        <EmptyState title="Войдите через лэндинг" description="Для просмотра результата необходимо войти" />
      )}
    </>
  )
}

export default GenerationResultPage
