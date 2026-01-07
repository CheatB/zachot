/**
 * Auth API endpoints
 * Refresh session и другие auth-операции
 */

import { API_BASE_URL } from '@/shared/config'

export interface RefreshResponse {
  accessToken: string
  refreshToken?: string
}

/**
 * Обновляет сессию через refresh token
 * @returns Новые токены
 * @throws Error если refresh неуспешен
 */
export async function refreshSession(): Promise<RefreshResponse> {
  const refreshToken = sessionStorage.getItem('zachot_refresh_token')
  
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    throw new Error(`Refresh failed: ${res.status}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token || data.accessToken,
    refreshToken: data.refresh_token || data.refreshToken,
  }
}


