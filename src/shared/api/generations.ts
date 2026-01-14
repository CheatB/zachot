import { apiFetch } from './http';
import type { 
  WorkType, 
  StructureItem, 
  SourceItem, 
  FormattingSettings,
  ComplexityLevel,
  PresentationStyle,
  TaskMode
} from '@/features/create-generation/types';

export interface GenerationInputPayload {
  topic?: string;
  input?: string;
  goal?: string;
  idea?: string;
  volume?: number;
  current_step?: number;
  presentation_style?: PresentationStyle;
  task_mode?: TaskMode;
  use_ai_images?: boolean;
  use_smart_processing?: boolean;
  has_files?: boolean;
}

export interface ImageSuggestion {
  slideId: number;
  description: string;
  style: string;
}

export interface GenerationSettingsPayload {
  structure?: StructureItem[];
  sources?: SourceItem[];
  formatting?: FormattingSettings;
  title_page?: {
    universityName: string;
    facultyName: string;
    departmentName: string;
    workType: string;
    discipline: string;
    theme: string;
    studentName: string;
    studentGroup: string;
    supervisorName: string;
    supervisorTitle: string;
    city: string;
    year: number;
  } | null;
  visual_upsell_suggestions?: ImageSuggestion[];
}

export interface Generation {
  id: string;
  title: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DRAFT' | 'GENERATED' | 'EXPORTED' | 'CANCELED' | 'WAITING_USER';
  module: 'TEXT' | 'PRESENTATION' | 'TASK' | 'GOST_FORMAT';
  work_type?: WorkType | null;
  complexity_level?: ComplexityLevel;
  humanity_level?: string | number; // Backend uses string ('low', 'medium', 'high'), frontend uses number (0-100)
  created_at: string;
  updated_at: string;
  input_payload: GenerationInputPayload;
  settings_payload: GenerationSettingsPayload;
  result_content?: string;
}

export interface GenerationsResponse {
  items: Generation[];
}

export interface CreateGenerationData {
  module: string;
  work_type?: string | null;
  complexity_level?: string;
  humanity_level?: string; // Backend expects string ('low', 'medium', 'high')
  input_payload: GenerationInputPayload;
  settings_payload?: GenerationSettingsPayload;
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
