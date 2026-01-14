/**
 * GenerationEditorPage
 * Страница редактирования сгенерированного текста с AI-ассистентом
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Stack, Button } from '@/ui'
import { getGenerationById, updateGeneration, type Generation } from '@/shared/api/generations'
import TextEditor from './components/TextEditor'
import { useToast } from '@/ui/primitives/Toast'

function GenerationEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    if (!id) return
    
    getGenerationById(id)
      .then((gen) => {
        setGeneration(gen)
        setContent(gen.result_content || '')
        setLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load generation:', error)
        showToast('Не удалось загрузить работу', 'error')
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Автосохранение каждые 5 секунд
  useEffect(() => {
    if (!id || !content || loading) return
    
    const timer = setTimeout(async () => {
      try {
        setSaving(true)
        await updateGeneration(id, {
          result_content: content,
        } as any)
        setLastSaved(new Date())
      } catch (error) {
        console.error('Autosave failed:', error)
      } finally {
        setSaving(false)
      }
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [content, id, loading])

  const handleSave = async () => {
    if (!id) return
    
    setSaving(true)
    try {
      await updateGeneration(id, {
        result_content: content,
      } as any)
      setLastSaved(new Date())
      showToast('Изменения сохранены', 'success')
    } catch (error) {
      console.error('Save failed:', error)
      showToast('Не удалось сохранить изменения', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleContinue = () => {
    if (!id) return
    navigate(`/generations/${id}/formatting`)
  }

  if (loading) {
    return (
      <Container>
        <Stack gap="lg" align="center" style={{ padding: 'var(--spacing-64) 0' }}>
          <p>Загрузка...</p>
        </Stack>
      </Container>
    )
  }

  // Inject styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'editor-page-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = pageStyles
    }
  }, [])

  if (!generation) {
    return (
      <Container>
        <Stack gap="lg" align="center" style={{ padding: 'var(--spacing-64) 0' }}>
          <p>Генерация не найдена</p>
          <Button onClick={() => navigate('/generations')}>Вернуться к списку</Button>
        </Stack>
      </Container>
    )
  }

  return (
    <div className="editor-page">
      <div className="editor-header">
        <Container>
          <div className="editor-header__content">
            <div className="editor-header__left">
              <h1 className="editor-header__title">{generation.title || 'Редактирование работы'}</h1>
              <span className="editor-header__status">
                {lastSaved ? `Сохранено ${lastSaved.toLocaleTimeString()}` : 'Не сохранено'}
              </span>
            </div>
            <div className="editor-header__right">
              <Button variant="secondary" onClick={handleSave} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button variant="primary" onClick={handleContinue}>
                Продолжить →
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="editor-container">
          <TextEditor 
            initialContent={content}
            onChange={setContent}
            generationId={id || ''}
          />
        </div>
      </Container>
    </div>
  )
}

const pageStyles = `
.editor-page {
  min-height: 100vh;
  background: var(--color-background);
}

.editor-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  border-bottom: 1px solid var(--color-border-base);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.editor-header__content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-16) 0;
  gap: var(--spacing-24);
}

.editor-header__left {
  flex: 1;
  min-width: 0;
}

.editor-header__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-neutral-110);
  margin: 0 0 var(--spacing-4) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-header__status {
  font-size: 13px;
  color: var(--color-text-muted);
}

.editor-header__right {
  display: flex;
  gap: var(--spacing-12);
  flex-shrink: 0;
}

.editor-container {
  max-width: 900px;
  margin: var(--spacing-32) auto;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  min-height: calc(100vh - 200px);
}

@media (max-width: 768px) {
  .editor-header__content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .editor-header__right {
    width: 100%;
  }
  
  .editor-header__right button {
    flex: 1;
  }
  
  .editor-container {
    margin: var(--spacing-16) auto;
  }
}
`

export default GenerationEditorPage

