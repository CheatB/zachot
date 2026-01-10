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
  return localStorage.getItem('zachot_auth_token')
}

let refreshPromise: Promise<void> | null = null

function performLogout() {
  localStorage.removeItem('zachot_auth_token')
  localStorage.removeItem('zachot_auth_user_id')
  localStorage.removeItem('zachot_refresh_token')
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
            localStorage.setItem('zachot_auth_token', tokens.accessToken)
            if (tokens.refreshToken) {
              localStorage.setItem('zachot_refresh_token', tokens.refreshToken)
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
