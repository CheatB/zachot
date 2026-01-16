/**
 * Утилиты для обработки ошибок в приложении.
 */

import { useUIStore } from '@/shared/store'
import { ApiError } from '@/shared/api/http'

export interface ErrorDetails {
  message: string
  code?: string
  status?: number
  originalError?: unknown
}

/**
 * Обрабатывает ошибку и показывает уведомление пользователю.
 */
export function handleError(error: unknown, context?: string): ErrorDetails {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error)

  let errorDetails: ErrorDetails

  if (error instanceof ApiError) {
    errorDetails = {
      message: error.message,
      status: error.status,
      originalError: error,
    }
  } else if (error instanceof Error) {
    errorDetails = {
      message: error.message,
      originalError: error,
    }
  } else if (typeof error === 'string') {
    errorDetails = {
      message: error,
    }
  } else {
    errorDetails = {
      message: 'Произошла неизвестная ошибка',
      originalError: error,
    }
  }

  // Показываем уведомление через Zustand
  useUIStore.getState().addToast({
    type: 'error',
    message: errorDetails.message,
    duration: 5000,
  })

  return errorDetails
}

/**
 * Обёртка для async функций с автоматической обработкой ошибок.
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, context)
      throw error
    }
  }) as T
}

/**
 * Retry логика для async функций.
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    backoff?: boolean
    onRetry?: (attempt: number, error: unknown) => void
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true, onRetry } = options

  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt < maxRetries) {
        onRetry?.(attempt, error)
        
        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError
}

/**
 * Проверяет, является ли ошибка сетевой.
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status >= 500 || error.status === 0
  }
  
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout')
    )
  }
  
  return false
}

/**
 * Проверяет, является ли ошибка ошибкой аутентификации.
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401 || error.status === 403
  }
  
  return false
}
