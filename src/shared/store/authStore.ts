/**
 * Zustand store для управления аутентификацией.
 * 
 * Заменяет localStorage прямой доступ и предоставляет реактивное состояние.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name?: string
  role?: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  
  // Actions
  setAuth: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      setAuth: (token, user) => set({ 
        token, 
        user, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        token: null, 
        user: null, 
        isAuthenticated: false 
      }),
      
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user 
      }),
    }
  )
)

// Helper для получения токена (для API calls)
export const getAuthToken = () => useAuthStore.getState().token
