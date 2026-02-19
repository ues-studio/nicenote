import { create } from 'zustand'

interface Toast {
  id: string
  message: string
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string) => void
  removeToast: (id: string) => void
}

let nextId = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message) => {
    const id = String(++nextId)
    set((state) => ({ toasts: [...state.toasts, { id, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 5000)
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))
