/**
 * GenerationVisualsStep
 * Шаг 2: Выбор генерации иллюстраций
 * Specific for presentations.
 */

import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Card, Stack } from '@/ui'
import clsx from 'clsx'

interface GenerationVisualsStepProps {
  useAiImages: boolean
  onSelect: (value: boolean) => void
}

function GenerationVisualsStep({ useAiImages, onSelect }: GenerationVisualsStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: motionTokens.duration.slow,
        ease: motionTokens.easing.out,
      }}
    >
      <div className="wizard-step">
        <Stack gap="xl">
          <div className="visuals-grid">
            {/* Option 1: AI Illustrations */}
            <motion.button
              type="button"
              className={clsx('visual-option-card', useAiImages && 'visual-option-card--selected')}
              onClick={() => onSelect(true)}
              whileHover={{ y: -4 }}
              whileTap={{ y: 0 }}
            >
              <div className="visual-option-card__badge">Рекомендуется</div>
              <div className="visual-option-card__icon">🎨</div>
              <div className="visual-option-card__content">
                <h3 className="visual-option-card__title">Генерировать иллюстрации</h3>
                <p className="visual-option-card__description">
                  Нейросеть создаст уникальные изображения для каждого слайда в выбранном стиле.
                </p>
                <div className="visual-option-card__price">+ 150 ₽</div>
              </div>
              {useAiImages && <div className="visual-option-card__check">✓</div>}
            </motion.button>

            {/* Option 2: No Illustrations */}
            <motion.button
              type="button"
              className={clsx('visual-option-card', !useAiImages && 'visual-option-card--selected')}
              onClick={() => onSelect(false)}
              whileHover={{ y: -4 }}
              whileTap={{ y: 0 }}
            >
              <div className="visual-option-card__icon">📄</div>
              <div className="visual-option-card__content">
                <h3 className="visual-option-card__title">Только текст и структура</h3>
                <p className="visual-option-card__description">
                  Презентация будет содержать только текст и графические элементы оформления без картинок.
                </p>
                <div className="visual-option-card__price">Бесплатно</div>
              </div>
              {!useAiImages && <div className="visual-option-card__check">✓</div>}
            </motion.button>
          </div>

          <Card variant="default" style={{ padding: 'var(--spacing-20)', backgroundColor: 'var(--color-neutral-10)' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Иллюстрации генерируются с помощью модели **DALL-E 3** или **Midjourney** (в зависимости от выбранного стиля) 
              и полностью соответствуют теме вашего выступления.
            </p>
          </Card>
        </Stack>
      </div>

      <style>{`
        .visuals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-24);
        }
        
        .visual-option-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--spacing-32);
          background: white;
          border: 2px solid var(--color-border-base);
          border-radius: var(--radius-xl);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .visual-option-card:hover {
          border-color: var(--color-accent-base);
          box-shadow: var(--elevation-3);
        }
        
        .visual-option-card--selected {
          border-color: var(--color-accent-base);
          background-color: var(--color-accent-light);
        }
        
        .visual-option-card__badge {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          background-color: var(--color-accent-base);
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .visual-option-card__icon {
          font-size: 48px;
          margin-bottom: var(--spacing-16);
        }
        
        .visual-option-card__title {
          font-size: 18px;
          font-weight: 800;
          color: var(--color-neutral-110);
          margin-bottom: 8px;
        }
        
        .visual-option-card__description {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.4;
          margin-bottom: var(--spacing-16);
        }
        
        .visual-option-card__price {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-accent-dark);
        }
        
        .visual-option-card__check {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 24px;
          height: 24px;
          background-color: var(--color-accent-base);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }
      `}</style>
    </motion.div>
  )
}

export default GenerationVisualsStep

