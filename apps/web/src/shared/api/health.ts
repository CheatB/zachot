/**
 * Health check API
 * Тестовый API-вызов для проверки подключения
 */

import { apiFetch } from './http'

export interface HealthResponse {
  status: string
  timestamp?: string
}

/**
 * Проверяет доступность API
 * @returns HealthResponse
 * @throws ApiError если API недоступен
 */
export async function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health')
}

