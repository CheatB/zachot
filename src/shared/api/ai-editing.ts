/**
 * AI Editing API
 * API для AI-редактирования текста
 */

import { apiFetch } from './http'

export interface AIEditRequest {
  text: string
  action: 'rewrite' | 'shorter' | 'longer'
  context?: string
}

export interface AIEditResponse {
  edited_text: string
  tokens_used: number
  model_used: string
}

export interface AIGenerateContentRequest {
  type: 'chart' | 'table' | 'custom'
  instruction?: string
  context?: string
}

export interface AIGenerateContentResponse {
  content: string
  tokens_used: number
  model_used: string
}

export async function aiEditText(
  generationId: string,
  data: AIEditRequest
): Promise<AIEditResponse> {
  return apiFetch<AIEditResponse>(
    `/generations/${generationId}/ai-edit`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

export async function aiGenerateContent(
  generationId: string,
  data: AIGenerateContentRequest
): Promise<AIGenerateContentResponse> {
  return apiFetch<AIGenerateContentResponse>(
    `/generations/${generationId}/ai-generate`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

