/**
 * User /me endpoint
 * Проверка текущей сессии пользователя
 */

import { apiFetch } from './http'

export interface MeResponse {
  id: string
}

/**
 * Получает информацию о текущем пользователе
 * @returns MeResponse с id пользователя
 * @throws ApiError если сессия невалидна
 */
export async function fetchMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/me')
}

