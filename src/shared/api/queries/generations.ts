/**
 * React Query hooks для работы с генерациями.
 * 
 * Преимущества:
 * - Автоматическое кэширование
 * - Автоматическое обновление статусов
 * - Оптимистичные обновления
 * - Уменьшение нагрузки на сервер
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import * as api from '../generations'
import type { Generation, CreateGenerationData } from '../generations'

// Query Keys - константы для идентификации запросов
export const generationKeys = {
  all: ['generations'] as const,
  lists: () => [...generationKeys.all, 'list'] as const,
  list: () => [...generationKeys.lists()] as const,
  details: () => [...generationKeys.all, 'detail'] as const,
  detail: (id: string) => [...generationKeys.details(), id] as const,
}

/**
 * Hook для получения списка генераций пользователя.
 * 
 * Кэширует результат на 30 секунд.
 */
export function useGenerations() {
  return useQuery({
    queryKey: generationKeys.list(),
    queryFn: api.fetchGenerations,
    staleTime: 30000, // 30 секунд
  })
}

/**
 * Hook для получения одной генерации по ID.
 * 
 * Автоматически обновляется каждые 3 секунды для активных генераций (RUNNING).
 */
export function useGeneration(
  id: string,
  options?: Omit<UseQueryOptions<Generation>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: generationKeys.detail(id),
    queryFn: () => api.getGenerationById(id),
    enabled: !!id,
    // Автоматическое обновление для активных генераций
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false
      
      // Обновляем каждые 3 секунды для активных генераций
      if (data.status === 'RUNNING' || data.status === 'PENDING') {
        return 3000
      }
      
      return false
    },
    ...options,
  })
}

/**
 * Hook для создания новой генерации.
 * 
 * Автоматически инвалидирует кэш списка генераций после успешного создания.
 */
export function useCreateGeneration() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createGeneration,
    onSuccess: (newGeneration) => {
      // Инвалидируем список генераций
      queryClient.invalidateQueries({ queryKey: generationKeys.lists() })
      
      // Добавляем новую генерацию в кэш
      queryClient.setQueryData(
        generationKeys.detail(newGeneration.id),
        newGeneration
      )
    },
  })
}

/**
 * Hook для обновления генерации.
 * 
 * Использует оптимистичное обновление для мгновенного отклика UI.
 */
export function useUpdateGeneration(generationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<CreateGenerationData>) =>
      api.updateGeneration(generationId, data),
    
    // Оптимистичное обновление
    onMutate: async (newData) => {
      // Отменяем текущие запросы для этой генерации
      await queryClient.cancelQueries({ 
        queryKey: generationKeys.detail(generationId) 
      })
      
      // Сохраняем предыдущее значение для отката
      const previousGeneration = queryClient.getQueryData<Generation>(
        generationKeys.detail(generationId)
      )
      
      // Оптимистично обновляем UI
      if (previousGeneration) {
        const updatedGen: Generation = {
          ...previousGeneration,
          ...(newData as Partial<Generation>),
          updated_at: new Date().toISOString(),
        }
        queryClient.setQueryData<Generation>(
          generationKeys.detail(generationId),
          updatedGen
        )
      }
      
      return { previousGeneration }
    },
    
    // Откат при ошибке
    onError: (_err, _newData, context) => {
      if (context?.previousGeneration) {
        queryClient.setQueryData(
          generationKeys.detail(generationId),
          context.previousGeneration
        )
      }
    },
    
    // Обновление после успеха
    onSuccess: (updatedGeneration) => {
      queryClient.setQueryData(
        generationKeys.detail(generationId),
        updatedGeneration
      )
      queryClient.invalidateQueries({ queryKey: generationKeys.lists() })
    },
  })
}

/**
 * Hook для удаления генерации.
 * 
 * Автоматически обновляет список после удаления.
 */
export function useDeleteGeneration() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deleteGeneration,
    onSuccess: (_, deletedId) => {
      // Удаляем из кэша
      queryClient.removeQueries({ 
        queryKey: generationKeys.detail(deletedId) 
      })
      
      // Обновляем список
      queryClient.invalidateQueries({ queryKey: generationKeys.lists() })
    },
  })
}

/**
 * Hook для выполнения действия с генерацией (next, confirm, cancel).
 */
export function useExecuteAction(generationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (action: 'next' | 'confirm' | 'cancel') =>
      api.executeAction(generationId, action),
    onSuccess: (updatedGeneration) => {
      // Обновляем генерацию в кэше
      queryClient.setQueryData(
        generationKeys.detail(generationId),
        updatedGeneration
      )
      queryClient.invalidateQueries({ queryKey: generationKeys.lists() })
    },
  })
}

/**
 * Hook для создания job (запуск генерации).
 */
export function useCreateJob(generationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => api.createJob(generationId),
    onSuccess: () => {
      // Начинаем автоматическое обновление генерации
      queryClient.invalidateQueries({ 
        queryKey: generationKeys.detail(generationId) 
      })
    },
  })
}
