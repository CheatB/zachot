/**
 * React Query Provider
 * 
 * Настраивает глобальный QueryClient для всего приложения.
 * Обеспечивает кэширование, автоматическое обновление и оптимистичные обновления.
 */

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Создаем QueryClient с оптимальными настройками
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Кэширование
      staleTime: 30000,              // Данные считаются свежими 30 секунд
      gcTime: 300000,                // Неиспользуемые данные удаляются через 5 минут (было cacheTime)
      
      // Поведение
      refetchOnWindowFocus: false,   // Не перезагружать при фокусе окна
      refetchOnReconnect: true,      // Перезагружать при восстановлении соединения
      retry: 1,                      // Одна попытка повтора при ошибке
      
      // Для production можно включить:
      // refetchOnMount: false,      // Не перезагружать при монтировании, если данные свежие
    },
    mutations: {
      // Retry для мутаций отключен по умолчанию (это правильно)
      retry: false,
    },
  },
})

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
