/**
 * TaskInputStep
 * Шаг 2 для задач: Загрузка условия (текст, фото, документы)
 */

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { motion as motionTokens } from '@/design-tokens'
import { Textarea, Button, Card, Stack } from '@/ui'
import { useDropzone } from 'react-dropzone'

interface TaskInputStepProps {
  input: string
  files: File[]
  onInputChange: (value: string) => void
  onFilesChange: (files: File[]) => void
}

function TaskInputStep({ input, files, onInputChange, onFilesChange }: TaskInputStepProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesChange([...files, ...acceptedFiles])
  }, [files, onFilesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
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
        duration: motionTokens.duration.base,
        ease: motionTokens.easing.out,
      }}
    >
      <div className="wizard-step">
        <Stack gap="xl">
          <div 
            {...getRootProps()} 
            style={{
              padding: 'var(--spacing-32)',
              border: '2px dashed var(--color-border-base)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              backgroundColor: isDragActive ? 'var(--color-accent-light)' : 'var(--color-neutral-10)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <input {...getInputProps()} />
            <div style={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--spacing-12)' }}>📸</div>
            <p style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
              {isDragActive ? 'Сбросьте файлы сюда' : 'Нажмите или перетащите фото/документ'}
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-8)' }}>
              PNG, JPG, PDF, DOCX
            </p>
          </div>

          {files.length > 0 && (
            <div className="task-files-list">
              <Stack gap="xs">
                {files.map((file, index) => (
                  <Card key={index} style={{ padding: 'var(--spacing-12) var(--spacing-16)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)' }}>
                        <span>📄</span>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>{file.name}</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)} style={{ color: 'var(--color-danger-base)' }}>✕</Button>
                    </div>
                  </Card>
                ))}
              </Stack>
            </div>
          )}

          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>— или введите текст —</div>

          <Textarea
            label="Текст задачи"
            placeholder="Вставьте текст задачи, условия и требования к решению..."
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            rows={6}
          />
        </Stack>
      </div>
    </motion.div>
  )
}

export default TaskInputStep

