/**
 * User /me endpoint
 * Проверка текущей сессии пользователя
 */

import { apiFetch } from './http'

export interface MeResponse {
  id: string;
  subscription: {
    planName: string;
    status: 'active' | 'expiring' | 'paused';
    monthlyPriceRub: number;
    nextBillingDate?: string;
  };
  usage: {
    generationsUsed: number;
    generationsLimit: number;
    tokensUsed: number;
    tokensLimit: number;
  };
}

/**
 * Получает информацию о текущем пользователе
 * @returns MeResponse с id пользователя
 * @throws ApiError если сессия невалидна
 */
export async function fetchMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/me')
}

