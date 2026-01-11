/**
 * User /me endpoint
 * Проверка текущей сессии пользователя
 */

import { apiFetch } from './http'

export interface MeResponse {
  id: string;
  role: 'admin' | 'user';
  email?: string;
  telegram_username?: string;
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
    creditsBalance: number;
    creditsUsed: number;
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

