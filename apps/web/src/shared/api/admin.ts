import { apiFetch } from './http';

export interface ModelRoutingConfig {
  main: {
    [workType: string]: {
      [stage: string]: string;
    };
  };
  fallback: {
    [category: string]: {
      [stage: string]: string;
    };
  };
}

export interface PromptConfig {
  [name: string]: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  generations_used: number;
  generations_limit: number;
  tokens_used: number;
  tokens_limit: number;
  subscription_status: string;
}

export interface AdminAnalytics {
  revenueRub: number;
  apiCostsUsd: number;
  marginPercent: number;
  totalJobs: number;
  dailyStats: {
    date: string;
    tokens: number;
    jobs: number;
  }[];
}

/**
 * Получить текущие настройки роутинга моделей
 */
export async function fetchModelRouting(): Promise<ModelRoutingConfig> {
  return apiFetch<ModelRoutingConfig>('/admin/model-routing');
}

/**
 * Сохранить настройки роутинга моделей
 */
export async function saveModelRouting(config: ModelRoutingConfig): Promise<void> {
  await apiFetch('/admin/model-routing', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

/**
 * Получить текущие промпты
 */
export async function fetchPrompts(): Promise<PromptConfig> {
  return apiFetch<PromptConfig>('/admin/prompts');
}

/**
 * Сохранить промпты
 */
export async function savePrompts(prompts: PromptConfig): Promise<void> {
  await apiFetch('/admin/prompts', {
    method: 'POST',
    body: JSON.stringify(prompts),
  });
}

/**
 * Получить список пользователей (админ)
 */
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await apiFetch<{ items: AdminUser[] }>('/admin/users');
  return response.items;
}

/**
 * Обновить роль пользователя
 */
export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
  await apiFetch(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

/**
 * Получить аналитику (админ)
 */
export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  return apiFetch<AdminAnalytics>('/admin/analytics');
}

/**
 * Предложить детали работы на основе темы
 */
export async function suggestDetails(topic: string): Promise<{ goal: string; idea: string }> {
  return apiFetch<{ goal: string; idea: string }>('/admin/suggest-details', {
    method: 'POST',
    body: JSON.stringify({ topic }),
  });
}

/**
 * Предложить структуру работы на основе темы, цели и идеи
 */
export async function suggestStructure(data: { 
  topic: string; 
  goal: string; 
  idea: string; 
  workType: string; 
  volume: number;
  complexity: string;
}): Promise<{ structure: { title: string; level: number }[] }> {
  return apiFetch<{ structure: { title: string; level: number }[] }>('/admin/suggest-structure', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Предложить источники литературы на основе темы и параметров
 */
export async function suggestSources(data: { 
  topic: string; 
  workType: string; 
  volume: number; 
  complexity: string;
}): Promise<{ sources: { title: string; url: string; description: string; isAiSelected: boolean }[] }> {
  return apiFetch<{ sources: { title: string; url: string; description: string; isAiSelected: boolean }[] }>('/admin/suggest-sources', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
