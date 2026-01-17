import { useState, useEffect } from 'react'
import { getGenerationCost, confirmGeneration, type GenerationCostInfo } from '@/shared/api/generations'
import './modals.css'

interface ConfirmCostModalProps {
  generationId: string
  onConfirm: () => void
  onCancel: () => void
  onNeedCredits: () => void
}

function ConfirmCostModal({ 
  generationId, 
  onConfirm, 
  onCancel,
  onNeedCredits 
}: ConfirmCostModalProps) {
  const [costInfo, setCostInfo] = useState<GenerationCostInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    getGenerationCost(generationId)
      .then(setCostInfo)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [generationId])

  const handleConfirm = async () => {
    if (!costInfo?.can_generate) {
      onNeedCredits()
      return
    }

    setConfirming(true)
    try {
      await confirmGeneration(generationId)
      onConfirm()
    } catch (error) {
      console.error('Failed to confirm:', error)
      alert('Не удалось подтвердить генерацию.')
      setConfirming(false)
    }
  }

  if (loading || !costInfo) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  const workTypeNames: Record<string, string> = {
    'referat': 'Реферат',
    'essay': 'Эссе',
    'kursach': 'Курсовая работа',
    'article': 'Научная статья',
    'presentation': 'Презентация',
    'other': 'Другое'
  }

  const formatCredits = (count: number): string => {
    if (count % 10 === 1 && count % 100 !== 11) return 'кредит'
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'кредита'
    return 'кредитов'
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-cost-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onCancel}>×</button>
        
        <h2>🎓 Подтверждение создания работы</h2>
        
        <div className="cost-info">
          <div className="info-row">
            <span>Тип работы:</span>
            <strong>{workTypeNames[costInfo.work_type] || costInfo.work_type}</strong>
          </div>
          
          <div className="info-row">
            <span>Стоимость:</span>
            <strong className="credits-amount">
              {costInfo.required_credits} {formatCredits(costInfo.required_credits)}
            </strong>
          </div>
          
          <div className="info-row">
            <span>Ваш баланс:</span>
            <strong className={costInfo.can_generate ? 'balance-ok' : 'balance-low'}>
              {costInfo.available_credits} {formatCredits(costInfo.available_credits)}
            </strong>
          </div>
          
          {costInfo.can_generate && (
            <div className="info-row balance-after">
              <span>Останется после создания:</span>
              <strong>
                {costInfo.available_credits - costInfo.required_credits} {formatCredits(costInfo.available_credits - costInfo.required_credits)}
              </strong>
            </div>
          )}
        </div>

        {!costInfo.can_generate && (
          <div className="warning-message">
            ⚠️ Недостаточно кредитов для создания этой работы.
          </div>
        )}

        <div className="modal-actions">
          <button 
            className="btn-secondary" 
            onClick={onCancel}
            disabled={confirming}
          >
            Отменить
          </button>
          
          <button 
            className={costInfo.can_generate ? "btn-success" : "btn-primary"}
            onClick={handleConfirm}
            disabled={confirming}
          >
            {costInfo.can_generate 
              ? (confirming ? 'Создаём...' : 'Создать')
              : 'Пополнить баланс'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmCostModal
