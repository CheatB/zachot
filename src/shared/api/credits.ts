/**
 * API функции для работы с кредитами
 */

import { apiFetch } from './http'

export interface CreditPackage {
  id: string
  credits: number
  price_rub: number
  name: string
  description: string
}

export interface PurchaseCreditsResponse {
  payment_id: string
  payment_url: string
  order_id: string
}

/**
 * Получает список доступных пакетов кредитов
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  return apiFetch<CreditPackage[]>('/credits/packages')
}

/**
 * Инициирует покупку пакета кредитов
 */
export async function purchaseCredits(packageId: string): Promise<PurchaseCreditsResponse> {
  return apiFetch<PurchaseCreditsResponse>('/credits/purchase', {
    method: 'POST',
    body: JSON.stringify({ package_id: packageId })
  })
}
