import { apiFetch } from './http'

export interface ReferralInfo {
  referral_code: string
  referrals_count: number
  credits_earned: number
}

export async function fetchReferralInfo(): Promise<ReferralInfo> {
  return apiFetch<ReferralInfo>('/me/referral-info')
}
