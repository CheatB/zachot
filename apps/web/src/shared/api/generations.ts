import { apiFetch } from './http';

export interface Generation {
  id: string;
  title: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DRAFT' | 'GENERATED' | 'EXPORTED' | 'CANCELED' | 'WAITING_USER';
  module: 'TEXT' | 'PRESENTATION' | 'TASK';
  work_type?: string | null;
  complexity_level?: string;
  humanity_level?: number;
  created_at: string;
  updated_at: string;
  input_payload: Record<string, any>;
  settings_payload: Record<string, any>;
  result_content?: string;
}

export interface GenerationsResponse {
  items: Generation[];
}

export interface CreateGenerationData {
  module: string;
  work_type?: string | null;
  complexity_level?: string;
  humanity_level?: number;
  input_payload: Record<string, any>;
  settings_payload?: Record<string, any>;
}

export async function fetchGenerations(): Promise<GenerationsResponse> {
  return apiFetch<GenerationsResponse>('/generations');
}

export async function getGenerationById(id: string): Promise<Generation> {
  return apiFetch<Generation>(`/generations/${id}`);
}

export async function createGeneration(data: CreateGenerationData): Promise<Generation> {
  return apiFetch<Generation>('/generations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGeneration(id: string, data: Partial<CreateGenerationData>): Promise<Generation> {
  return apiFetch<Generation>(`/generations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteGeneration(id: string): Promise<void> {
  return apiFetch<void>(`/generations/${id}`, {
    method: 'DELETE',
  });
}

export async function smartEdit(id: string, action: string, content: string): Promise<Generation> {
  return apiFetch<Generation>(`/generations/${id}/smart-edit`, {
    method: 'POST',
    body: JSON.stringify({ action, content }),
  });
}

export async function executeAction(id: string, action: 'next' | 'confirm' | 'cancel'): Promise<Generation> {
  return apiFetch<Generation>(`/generations/${id}/actions`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export async function createJob(id: string): Promise<{ job_id: string; status: string }> {
  return apiFetch<{ job_id: string; status: string }>(`/generations/${id}/jobs`, {
    method: 'POST',
  });
}
