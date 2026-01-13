/**
 * DocUploadStep
 * Шаг 1.8: Загрузка документа для оформления по ГОСТу
 */

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Button, Card, Stack } from '@/ui'
import { useDropzone } from 'react-dropzone'

interface DocUploadStepProps {
  files: File[]
  onFilesChange: (files: File[]) => void
}

function DocUploadStep({ files, onFilesChange }: DocUploadStepProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesChange([...files, ...acceptedFiles])
  }, [files, onFilesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf'],
    }
  })

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    onFilesChange(newFiles)
  }

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
          <div 
            {...getRootProps()} 
            style={{
              padding: 'var(--spacing-48)',
              border: '2px dashed var(--color-border-base)',
              borderRadius: 'var(--radius-xl)',
              textAlign: 'center',
              backgroundColor: isDragActive ? 'var(--color-accent-light)' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--elevation-1)'
            }}
          >
            <input {...getInputProps()} />
            <div style={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--spacing-16)' }}>📂</div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-8)' }}>
              {isDragActive ? 'Сбросьте файл' : 'Загрузите вашу работу'}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
              Мы проанализируем текст, исправим ошибки и оформим его по выбранному стандарту.
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-16)' }}>
              Поддерживаемые форматы: DOCX, DOC, PDF
            </p>
          </div>

          {files.length > 0 && (
            <div className="files-list">
              <Stack gap="sm">
                {files.map((file, index) => (
                  <Card key={index} style={{ padding: 'var(--spacing-16) var(--spacing-24)', border: '1px solid var(--color-accent-base)', backgroundColor: 'var(--color-accent-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-16)' }}>
                        <span style={{ fontSize: '24px' }}>📄</span>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>{file.name}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)} style={{ color: 'var(--color-danger-base)' }}>Удалить</Button>
                    </div>
                  </Card>
                ))}
              </Stack>
            </div>
          )}

          <div style={{ padding: 'var(--spacing-24)', backgroundColor: 'var(--color-neutral-5)', borderRadius: 'var(--radius-lg)' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: '8px' }}>✨ Что мы сделаем:</h4>
            <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', paddingLeft: '20px', margin: 0 }}>
              <li>Проверим орфографию и пунктуацию</li>
              <li>Приведем шрифты и отступы к стандарту ГОСТ</li>
              <li>Оформим заголовки, списки и таблицы</li>
              <li>Проверим оформление списка литературы</li>
            </ul>
          </div>
        </Stack>
      </div>
    </motion.div>
  )
}

export default DocUploadStep

