/**
 * Zustand store для UI состояния (модалки, уведомления, глобальные флаги).
 */

import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

interface Modal {
  id: string
  component: string
  props?: Record<string, any>
}

interface UIState {
  // Toasts
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  
  // Modals
  modals: Modal[]
  openModal: (component: string, props?: Record<string, any>) => string
  closeModal: (id: string) => void
  closeAllModals: () => void
  
  // Global UI flags
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  // Loading states
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Toasts
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))
    
    // Auto-remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }))
      }, toast.duration || 5000)
    }
    
    return id
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
  
  // Modals
  modals: [],
  openModal: (component, props) => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({
      modals: [...state.modals, { id, component, props }]
    }))
    return id
  },
  closeModal: (id) => set((state) => ({
    modals: state.modals.filter((m) => m.id !== id)
  })),
  closeAllModals: () => set({ modals: [] }),
  
  // Sidebar
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  
  // Global loading
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}))
