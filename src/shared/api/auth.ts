import { apiFetch } from './http';

export interface TelegramAuthLink {
  link: string;
  token: string;
}

export interface TelegramAuthStatus {
  status: 'success' | 'pending';
  user_id?: string;
}

/**
 * Получить ссылку для привязки Telegram
 */
export async function getTelegramLink(): Promise<TelegramAuthLink> {
  return apiFetch<TelegramAuthLink>('/auth/telegram/link', {
    method: 'POST',
  });
}

/**
 * Проверить статус авторизации по токену
 */
export async function checkTelegramAuth(token: string): Promise<TelegramAuthStatus> {
  return apiFetch<TelegramAuthStatus>(`/auth/telegram/check/${token}`);
}

/**
 * Обновить сессию (dummy for now to fix build)
 */
export async function refreshSession(): Promise<{ accessToken: string; refreshToken?: string }> {
  // This would normally call /auth/refresh
  return { accessToken: 'dummy', refreshToken: 'dummy' };
}
