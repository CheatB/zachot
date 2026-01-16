/**
 * Провайдер для обработки оффлайн-режима.
 * 
 * Отслеживает состояние сети и показывает уведомления пользователю.
 */

import { useEffect, useState } from 'react'
import { useUIStore } from '@/shared/store'

interface OfflineProviderProps {
  children: React.ReactNode
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const addToast = useUIStore((state) => state.addToast)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      addToast({
        type: 'success',
        message: 'Соединение восстановлено',
        duration: 3000,
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      addToast({
        type: 'warning',
        message: 'Нет подключения к интернету. Некоторые функции могут быть недоступны.',
        duration: 0, // Не скрывать автоматически
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [addToast])

  // Можно добавить визуальный индикатор оффлайн-режима
  return (
    <>
      {!isOnline && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#f59e0b',
            color: 'white',
            padding: '8px',
            textAlign: 'center',
            zIndex: 9999,
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          ⚠️ Нет подключения к интернету
        </div>
      )}
      {children}
    </>
  )
}
