/**
 * TypeScript типы, соответствующие backend API схемам.
 */

export type GenerationModule = 'TEXT' | 'PRESENTATION' | 'TASK';

export type GenerationStatus =
  | 'DRAFT'
  | 'RUNNING'
  | 'WAITING_USER'
  | 'GENERATED'
  | 'EXPORTED'
  | 'FAILED'
  | 'CANCELED';

export type GenerationAction = 'next' | 'confirm' | 'cancel';

export interface Generation {
  id: string;
  module: GenerationModule;
  status: GenerationStatus;
  created_at: string;
  updated_at: string;
  input_payload: Record<string, unknown>;
  settings_payload: Record<string, unknown>;
}

export interface GenerationCreateRequest {
  module: GenerationModule;
  input_payload?: Record<string, unknown>;
  settings_payload?: Record<string, unknown>;
}

export interface GenerationUpdateRequest {
  input_payload?: Record<string, unknown>;
  settings_payload?: Record<string, unknown>;
}

export interface ActionRequest {
  action: GenerationAction;
}

export interface JobQueuedResponse {
  job_id: string;
  status: 'queued';
}

export interface GenerationEvent {
  id: string;
  status: GenerationStatus;
  updated_at: string;
}


