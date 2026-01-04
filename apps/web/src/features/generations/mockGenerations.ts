/**
 * Mock generations data
 * Временные данные для разработки
 */

import type { Generation } from './generationTypes'

export const mockGenerations: Generation[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Конспект по истории России',
    module: 'text',
    status: 'completed',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 минут назад
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Презентация по биологии',
    module: 'presentation',
    status: 'running',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 минут назад
    updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 минуты назад
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    title: 'Задачи по математике',
    module: 'tasks',
    status: 'failed',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 минут назад
    updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 минут назад
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    title: 'Конспект по литературе',
    module: 'text',
    status: 'completed',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 часа назад
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    title: 'Презентация по физике',
    module: 'presentation',
    status: 'draft',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 день назад
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    title: 'Задачи по химии',
    module: 'tasks',
    status: 'completed',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 дня назад
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    title: 'Конспект по географии',
    module: 'text',
    status: 'completed',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 дней назад
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]


