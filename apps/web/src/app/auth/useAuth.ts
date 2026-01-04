/**
 * useAuth hook
 * Удобный хук для доступа к auth контексту
 */

import { useAuthContext } from './authContext'
import type { AuthContextValue } from './authTypes'

export function useAuth(): AuthContextValue {
  return useAuthContext()
}


