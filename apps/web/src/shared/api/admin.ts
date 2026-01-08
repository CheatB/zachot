import { apiFetch } from './http';

export interface ModelRoutingConfig {
  [workType: string]: {
    [stage: string]: string;
  };
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
  return {
    essay: { structure: 'o4-mini', sources: 'gpt-5-mini', generation: 'gpt-5', refine: 'gpt-5-mini' },
    diploma: { structure: 'o3', sources: 'o4-mini', generation: 'gpt-5.2', refine: 'o4-mini' },
    presentation: { structure: 'o4-mini', sources: 'gpt-5-mini', generation: 'gpt-5-mini', refine: 'gpt-5-mini' },
    task: { structure: 'o3', sources: 'o4-mini', generation: 'o3', refine: 'o4-mini' },
  };
}

/**
 * Сохранить настройки роутинга моделей
 */
export async function saveModelRouting(config: ModelRoutingConfig): Promise<void> {
  console.log('[API] Saving model routing:', config);
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
  return {
    revenueRub: 149700,
    apiCostsUsd: 124.50,
    marginPercent: 82,
    totalJobs: 1240,
    dailyStats: [
      { date: '2026-01-01', tokens: 120000, jobs: 45 },
      { date: '2026-01-02', tokens: 150000, jobs: 52 },
      { date: '2026-01-03', tokens: 110000, jobs: 38 },
      { date: '2026-01-04', tokens: 180000, jobs: 61 },
      { date: '2026-01-05', tokens: 210000, jobs: 75 },
      { date: '2026-01-06', tokens: 195000, jobs: 68 },
      { date: '2026-01-07', tokens: 230000, jobs: 82 },
    ]
  };
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
