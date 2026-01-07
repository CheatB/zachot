// import { apiFetch } from './http';

export interface ModelRoutingConfig {
  [workType: string]: {
    [stage: string]: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  regDate: string;
  jobsCount: number;
  tokensUsed: number;
  subscriptionStatus: string;
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
  // В будущем: return apiFetch<ModelRoutingConfig>('/admin/model-routing');
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
  // В будущем:
  // await apiFetch('/admin/model-routing', {
  //   method: 'POST',
  //   body: JSON.stringify(config),
  // });
}

/**
 * Получить список пользователей (админ)
 */
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  // Имитация задержки сети
  await new Promise(r => setTimeout(r, 500));
  
  return [
    { id: '1', email: 'student1@university.ru', regDate: '2026-01-01', jobsCount: 5, tokensUsed: 120000, subscriptionStatus: 'active' },
    { id: '2', email: 'test_user@gmail.com', regDate: '2026-01-03', jobsCount: 2, tokensUsed: 45000, subscriptionStatus: 'active' },
    { id: '3', email: 'pro_writer@mail.ru', regDate: '2026-01-05', jobsCount: 12, tokensUsed: 480000, subscriptionStatus: 'expired' },
    { id: '4', email: 'ivanov@itmo.ru', regDate: '2026-01-06', jobsCount: 0, tokensUsed: 0, subscriptionStatus: 'none' },
  ];
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

