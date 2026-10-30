import { create } from 'zustand'

export type ToastTone = 'info' | 'success' | 'error'

export interface ToastMessage {
  id: number
  tone: ToastTone
  message: string
}

/** Older messages give way beyond this count. */
const MAX_TOASTS = 4

interface ToastState {
  toasts: ToastMessage[]
  push: (tone: ToastTone, message: string) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (tone, message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: nextId++, tone, message }].slice(-MAX_TOASTS),
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))

/**
 * Short message in the bottom right corner, callable from anywhere (a mutation's onSuccess...).
 * Errors that belong to a form are better shown in the form itself.
 */
export const toast = {
  info: (message: string) => useToastStore.getState().push('info', message),
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
}
