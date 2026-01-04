/**
 * API Client для работы с backend.
 * 
 * Пока возвращает mock data, но интерфейсы соответствуют backend схемам.
 * В будущем здесь будут реальные HTTP запросы.
 */

import {
  ActionRequest,
  Generation,
  GenerationCreateRequest,
  GenerationUpdateRequest,
  JobQueuedResponse,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Создает новую генерацию.
 */
export async function createGeneration(
  request: GenerationCreateRequest
): Promise<Generation> {
  // TODO: Реальная реализация
  // const response = await fetch(`${API_BASE_URL}/generations`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request),
  // });
  // return response.json();

  // Mock data
  return {
    id: crypto.randomUUID(),
    module: request.module,
    status: 'DRAFT',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    input_payload: request.input_payload || {},
    settings_payload: request.settings_payload || {},
  };
}

/**
 * Получает генерацию по ID.
 */
export async function getGeneration(generationId: string): Promise<Generation> {
  // TODO: Реальная реализация
  // const response = await fetch(`${API_BASE_URL}/generations/${generationId}`);
  // return response.json();

  // Mock data
  return {
    id: generationId,
    module: 'TEXT',
    status: 'DRAFT',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    input_payload: {},
    settings_payload: {},
  };
}

/**
 * Обновляет генерацию (partial update).
 */
export async function patchGeneration(
  generationId: string,
  request: GenerationUpdateRequest
): Promise<Generation> {
  // TODO: Реальная реализация
  // const response = await fetch(`${API_BASE_URL}/generations/${generationId}`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request),
  // });
  // return response.json();

  // Mock data
  const existing = await getGeneration(generationId);
  return {
    ...existing,
    ...(request.input_payload && { input_payload: request.input_payload }),
    ...(request.settings_payload && { settings_payload: request.settings_payload }),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Выполняет действие над генерацией.
 */
export async function actionGeneration(
  generationId: string,
  request: ActionRequest
): Promise<Generation> {
  // TODO: Реальная реализация
  // const response = await fetch(`${API_BASE_URL}/generations/${generationId}/actions`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request),
  // });
  // return response.json();

  // Mock data
  const existing = await getGeneration(generationId);
  let newStatus: Generation['status'] = existing.status;

  if (request.action === 'next' && existing.status === 'DRAFT') {
    newStatus = 'RUNNING';
  } else if (request.action === 'confirm' && existing.status === 'WAITING_USER') {
    newStatus = 'RUNNING';
  } else if (request.action === 'cancel') {
    newStatus = 'CANCELED';
  }

  return {
    ...existing,
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Ставит задачу в очередь.
 */
export async function enqueueJob(
  generationId: string
): Promise<JobQueuedResponse> {
  // TODO: Реальная реализация
  // const response = await fetch(`${API_BASE_URL}/generations/${generationId}/jobs`, {
  //   method: 'POST',
  // });
  // return response.json();

  // Mock data
  return {
    job_id: crypto.randomUUID(),
    status: 'queued',
  };
}


