import { API_BASE_URL } from '@/shared/config'
import { refreshSession } from './auth'
import { useAuthStore, useUIStore } from '@/shared/store'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function getAuthToken(): string | null {
  // Используем Zustand store вместо прямого доступа к localStorage
  return useAuthStore.getState().token
}

let refreshPromise: Promise<void> | null = null

function performLogout() {
  // Используем Zustand store для очистки состояния
  useAuthStore.getState().logout()
  window.dispatchEvent(new CustomEvent('auth:logout'))
  window.location.href = '/login'
}

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
    } catch {
      // Ignore JSON parse errors
    }

    if (res.status === 401 && !isRetry) {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const tokens = await refreshSession()
            // Обновляем токен через Zustand (автоматически сохраняется в localStorage)
            const currentUser = useAuthStore.getState().user
            if (currentUser) {
              useAuthStore.getState().setAuth(tokens.accessToken, currentUser)
            }
          } catch (error) {
            performLogout()
            throw error
          } finally {
            refreshPromise = null
          }
        })()
      }

      await refreshPromise
      return performFetch<T>(path, options, true)
    }

    if (res.status === 401) {
      performLogout()
    }

    // Centralized error notification через Zustand
    if (res.status !== 401) {
      useUIStore.getState().addToast({
        type: 'error',
        message: message,
        duration: 5000
      })
    }

    throw new ApiError(res.status, message)
  }

  return res.json()
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  return performFetch<T>(path, options, false)
}
