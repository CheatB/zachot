import { useNavigate } from 'react-router-dom'

interface SubscriptionOfferModalProps {
  onClose: () => void
  onDecline: () => void
}

function SubscriptionOfferModal({ onClose, onDecline }: SubscriptionOfferModalProps) {
  const navigate = useNavigate()

  const handleSubscribe = () => {
    navigate('/billing?period=month')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content subscription-offer" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="offer-icon">🎓</div>
        <h2>Оформите подписку</h2>
        <p className="offer-subtitle">
          Выгоднее, чем разовые покупки!
        </p>

        <div className="subscription-benefits">
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <span>5 кредитов каждый месяц</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <span>Автоматическое продление</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <span>Экономия до 40%</span>
          </div>
        </div>

        <div className="price-block">
          <div className="price-main">499 ₽</div>
          <div className="price-period">в месяц</div>
        </div>

        <div className="modal-actions vertical">
          <button 
            className="btn-primary large" 
            onClick={handleSubscribe}
          >
            Оформить подписку
          </button>
          
          <button 
            className="btn-text" 
            onClick={onDecline}
          >
            Нет, хочу купить только кредиты
          </button>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionOfferModal
