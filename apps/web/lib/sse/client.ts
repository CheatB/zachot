/**
 * EventSource helper для подписки на SSE события генерации.
 * 
 * Используется для получения обновлений статуса генерации в реальном времени.
 */

import { GenerationEvent } from '../types';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface SSEOptions {
  onMessage?: (event: GenerationEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Подписывается на события генерации через SSE.
 * 
 * @param generationId - ID генерации
 * @param options - Обработчики событий
 * @returns Функция для отписки
 * 
 * @example
 * ```ts
 * const unsubscribe = subscribeGenerationEvents(generationId, {
 *   onMessage: (event) => {
 *     console.log('Generation updated:', event);
 *   },
 *   onError: (error) => {
 *     console.error('SSE error:', error);
 *   },
 * });
 * 
 * // Позже отписаться
 * unsubscribe();
 * ```
 */
export function subscribeGenerationEvents(
  generationId: string,
  options: SSEOptions = {}
): () => void {
  // const url = `${API_BASE_URL}/generations/${generationId}/events`;
  
  // TODO: Реальная реализация с EventSource
  // const eventSource = new EventSource(url);
  // 
  // eventSource.onopen = () => {
  //   options.onOpen?.();
  // };
  // 
  // eventSource.addEventListener('generation', (e) => {
  //   try {
  //     const data = JSON.parse(e.data) as GenerationEvent;
  //     options.onMessage?.(data);
  //   } catch (error) {
  //     console.error('Failed to parse SSE message:', error);
  //   }
  // });
  // 
  // eventSource.onerror = (error) => {
  //   options.onError?.(error);
  // };
  // 
  // return () => {
  //   eventSource.close();
  //   options.onClose?.();
  // };

  // Mock implementation
  console.log(`[SSE] Subscribed to generation ${generationId} events`);
  
  // Симулируем получение событий
  const interval = setInterval(() => {
    const mockEvent: GenerationEvent = {
      id: generationId,
      status: 'RUNNING',
      updated_at: new Date().toISOString(),
    };
    options.onMessage?.(mockEvent);
  }, 5000);

  return () => {
    clearInterval(interval);
    console.log(`[SSE] Unsubscribed from generation ${generationId} events`);
    options.onClose?.();
  };
}


