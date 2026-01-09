/**
 * User /me endpoint
 * Проверка текущей сессии пользователя
 */

import { apiFetch } from './http'

export interface MeResponse {
  id: string;
  role: 'admin' | 'user';
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
  fairUseMode: 'normal' | 'degraded' | 'strict';
  capabilities: {
    streamingAvailable: boolean;
    maxTokensPerRequest: number;
    priority: 'low' | 'normal' | 'high';
    resultPersistence: boolean;
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

