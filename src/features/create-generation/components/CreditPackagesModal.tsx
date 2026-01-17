import { useState, useEffect } from 'react'
import { getCreditPackages, purchaseCredits, type CreditPackage } from '@/shared/api/credits'
import './modals.css'

interface CreditPackagesModalProps {
  onClose: () => void
}

function CreditPackagesModal({ onClose }: CreditPackagesModalProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  useEffect(() => {
    getCreditPackages()
      .then(setPackages)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handlePurchase = async (packageId: string) => {
    setPurchasing(true)
    setSelectedPackage(packageId)
    
    try {
      const result = await purchaseCredits(packageId)
      
      // Редирект на оплату
      window.location.href = result.payment_url
      
    } catch (error) {
      console.error('Failed to purchase:', error)
      alert('Не удалось инициировать покупку. Попробуйте еще раз.')
      setPurchasing(false)
      setSelectedPackage(null)
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content packages-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Выберите пакет кредитов</h2>
        <p className="modal-subtitle">Кредиты бессрочные и не сгорают</p>

        <div className="packages-grid">
          {packages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`package-card ${selectedPackage === pkg.id ? 'selected' : ''}`}
            >
              <div className="package-header">
                <div className="package-credits">{pkg.credits} кредитов</div>
                <div className="package-description">{pkg.description}</div>
              </div>
              
              <div className="package-price">
                <span className="price-amount">{pkg.price_rub} ₽</span>
                <span className="price-per-credit">
                  {Math.round(pkg.price_rub / pkg.credits)} ₽ за кредит
                </span>
              </div>
              
              <button
                className="btn-primary"
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing}
              >
                {purchasing && selectedPackage === pkg.id ? 'Обработка...' : 'Купить'}
              </button>
            </div>
          ))}
        </div>

        <div className="payment-methods">
          <span>Принимаем:</span>
          <span>💳 Visa • Mastercard • МИР</span>
        </div>
      </div>
    </div>
  )
}

export default CreditPackagesModal
