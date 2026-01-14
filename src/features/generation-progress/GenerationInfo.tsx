import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'

interface GenerationInfoProps {
  isReturning?: boolean
}

function GenerationInfo({ isReturning = false }: GenerationInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.slow,
        ease: motionTokens.easing.out,
        delay: 0.3,
      }}
    >
      <div className="generation-info-no-container">
        {isReturning ? (
          <>
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-12)',
              }}
            >
              Мы продолжаем работу с вашим запросом
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-relaxed)',
                marginBottom: 'var(--spacing-16)',
              }}
            >
              Генерация выполняется в фоновом режиме. Вы можете закрыть эту страницу — результат сохранится и будет доступен позже.
            </p>
          </>
        ) : (
          <>
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-12)',
              }}
            >
              Что происходит сейчас?
            </h3>
            <ul className="generation-info__list">
              <li className="generation-info__item">
                <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
                  Генерация может занять несколько минут
                </span>
              </li>
              <li className="generation-info__item">
                <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
                  Вы можете закрыть страницу — результат сохранится
                </span>
              </li>
              <li className="generation-info__item">
                <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
                  Когда всё будет готово, статус обновится автоматически
                </span>
              </li>
            </ul>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default GenerationInfo

const infoStyles = `
.generation-info-no-container { padding: 0; }
.generation-info__list { display: flex; flex-direction: column; gap: var(--spacing-16); list-style: none; padding: 0; margin: 0; }
.generation-info__item { display: flex; align-items: flex-start; gap: var(--spacing-12); margin-bottom: var(--spacing-8); }
.generation-info__item::before { content: '•'; color: var(--color-accent-base); font-size: var(--font-size-xl); line-height: var(--line-height-normal); flex-shrink: 0; }
`

if (typeof document !== 'undefined') {
  const styleId = 'generation-info-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = infoStyles
    document.head.appendChild(style)
  }
}
