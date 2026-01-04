/**
 * CreateGenerationPage
 * Wizard создания генерации
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/auth/useAuth'
import AppShell from '@/app/layout/AppShell'
import { Container, Stack, Button, EmptyState } from '@/ui'
import GenerationTypeStep from './GenerationTypeStep'
import GenerationInputStep from './GenerationInputStep'
import GenerationConfirmStep from './GenerationConfirmStep'
import type { CreateGenerationForm, GenerationType } from './types'

type WizardStep = 1 | 2 | 3

function CreateGenerationPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<CreateGenerationForm>({
    type: null,
    input: '',
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) {
    return (
      <AppShell>
        <EmptyState
          title="Войдите через лэндинг"
          description="Для создания генерации необходимо войти"
        />
      </AppShell>
    )
  }

  const handleTypeSelect = (type: GenerationType) => {
    setForm((prev) => ({ ...prev, type }))
    // Мягкая анимация подтверждения выбора
    setTimeout(() => {
      setCurrentStep(2)
    }, 300)
  }

  const handleInputChange = (value: string) => {
    setForm((prev) => ({ ...prev, input: value }))
  }

  const handleNext = () => {
    if (currentStep === 1 && form.type) {
      setCurrentStep(2)
    } else if (currentStep === 2 && form.input.trim()) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    } else if (currentStep === 3) {
      setCurrentStep(2)
    }
  }

  const handleConfirm = () => {
    setIsSubmitting(true)
    // Mock: симуляция отправки
    setTimeout(() => {
      navigate('/generations')
    }, 2000)
  }

  const canProceed = () => {
    if (currentStep === 1) return form.type !== null
    if (currentStep === 2) return form.input.trim().length > 0
    return true
  }

  return (
    <AppShell>
      <Container size="lg">
        <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-32)' }}>
          {/* Progress indicator */}
          <div className="wizard-progress">
            {[1, 2, 3].map((step) => (
              <div key={step} className="wizard-progress__item">
                <div
                  className={step <= currentStep ? 'wizard-progress__dot--active' : 'wizard-progress__dot'}
                />
                {step < 3 && (
                  <div
                    className={step < currentStep ? 'wizard-progress__line--active' : 'wizard-progress__line'}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Wizard steps */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <GenerationTypeStep
                key="step-1"
                selectedType={form.type}
                onSelect={handleTypeSelect}
              />
            )}
            {currentStep === 2 && form.type && (
              <GenerationInputStep
                key="step-2"
                type={form.type}
                input={form.input}
                onInputChange={handleInputChange}
              />
            )}
            {currentStep === 3 && form.type && (
              <GenerationConfirmStep
                key="step-3"
                type={form.type}
                input={form.input}
                onConfirm={handleConfirm}
                onBack={handleBack}
                isSubmitting={isSubmitting}
              />
            )}
          </AnimatePresence>

          {/* Navigation buttons (только для шагов 1 и 2) */}
          {currentStep < 3 && (
            <div className="wizard-navigation">
              {currentStep > 1 && (
                <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>
                  Назад
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
              >
                Далее
              </Button>
            </div>
          )}
        </Stack>
      </Container>
    </AppShell>
  )
}

export default CreateGenerationPage

const pageStyles = `
.wizard-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-8);
  margin-bottom: var(--spacing-32);
}

.wizard-progress__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-8);
}

.wizard-progress__dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  background-color: var(--color-border-base);
  transition: all var(--motion-duration-base) ease;
}

.wizard-progress__dot--active {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent-base);
  transition: all var(--motion-duration-base) ease;
}

.wizard-progress__line {
  width: 60px;
  height: 2px;
  background-color: var(--color-border-base);
  transition: all var(--motion-duration-base) ease;
}

.wizard-progress__line--active {
  width: 60px;
  height: 2px;
  background-color: var(--color-accent-base);
  transition: all var(--motion-duration-base) ease;
}

.wizard-navigation {
  display: flex;
  gap: var(--spacing-16);
  justify-content: flex-end;
  margin-top: var(--spacing-32);
}

@media (max-width: 768px) {
  .wizard-navigation {
    flex-direction: column-reverse;
  }
  
  .wizard-navigation button {
    width: 100%;
  }
}
`

if (typeof document !== 'undefined') {
  const styleId = 'create-generation-page-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = pageStyles
    document.head.appendChild(style)
  }
}

