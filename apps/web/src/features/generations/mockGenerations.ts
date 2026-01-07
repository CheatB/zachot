import type { Generation } from '@/shared/api/generations'

export const mockGenerations: Generation[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Конспект по истории России',
    module: 'TEXT',
    status: 'completed',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    input_payload: {},
    settings_payload: {},
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Презентация по биологии',
    module: 'PRESENTATION',
    status: 'running',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    input_payload: {},
    settings_payload: {},
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    title: 'Задачи по математике',
    module: 'TASK',
    status: 'failed',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    input_payload: {},
    settings_payload: {},
  }
]
