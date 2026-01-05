import { API_BASE_URL } from '@/shared/config'
import { refreshSession } from './auth'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function getAuthToken(): string | null {
  return sessionStorage.getItem('zachot_auth_token')
}

// Single-flight lock для refresh
let refreshPromise: Promise<void> | null = null

/**
 * Выполняет logout и редирект на /login
 * Вызывается при невозможности восстановить сессию
 */
function performLogout() {
  sessionStorage.removeItem('zachot_auth_token')
  sessionStorage.removeItem('zachot_auth_user_id')
  sessionStorage.removeItem('zachot_refresh_token')
  
  // Диспатчим событие для AuthContext
  window.dispatchEvent(new CustomEvent('auth:logout'))
  
  window.location.href = '/login'
}

/**
 * Внутренняя функция для выполнения запроса
 */
async function performFetch<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const token = getAuthToken()

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    let message = 'API error'
    try {
      const data = await res.json()
      message = data?.detail || data?.message || message
    } catch {}

    // Обработка 401 с refresh flow
    if (res.status === 401 && !isRetry) {
      // Пытаемся обновить токены
      try {
        // Single-flight lock: если refresh уже идёт, ждём его
        if (!refreshPromise) {
          refreshPromise = (async () => {
            try {
              const tokens = await refreshSession()
              
              // Обновляем токены в sessionStorage
              sessionStorage.setItem('zachot_auth_token', tokens.accessToken)
              if (tokens.refreshToken) {
                sessionStorage.setItem('zachot_refresh_token', tokens.refreshToken)
              }
            } catch (error) {
              // Refresh не удался — выполняем logout
              performLogout()
              throw error
            } finally {
              refreshPromise = null
            }
          })()
        }

        await refreshPromise

        // Повторяем исходный запрос с новым токеном
        return performFetch<T>(path, options, true)
      } catch (error) {
        // Refresh не удался, logout уже выполнен в performLogout
        throw new ApiError(401, 'Session expired')
      }
    }

    // Для других ошибок или если это уже retry
    if (res.status === 401) {
      performLogout()
    }

    throw new ApiError(res.status, message)
  }

  return res.json()
}

/**
 * Основная функция для API запросов с автоматическим refresh
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  return performFetch<T>(path, options, false)
}
