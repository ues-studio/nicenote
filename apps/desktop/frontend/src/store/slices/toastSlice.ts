import type { StateCreator } from 'zustand'

import type { DesktopStore } from '../useDesktopStore'

interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: string
  message: string
  action?: ToastAction
}

export interface ToastSlice {
  toasts: Toast[]
  addToast: (message: string, options?: { action?: ToastAction; duration?: number }) => string
  removeToast: (id: string) => void
}

let nextId = 0
const timerMap = new Map<string, ReturnType<typeof setTimeout>>()

export const createToastSlice: StateCreator<DesktopStore, [], [], ToastSlice> = (set) => ({
  toasts: [],

  addToast: (message, options) => {
    const id = String(++nextId)
    const duration = options?.duration ?? 5000

    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, message, ...(options?.action !== undefined ? { action: options.action } : {}) },
      ],
    }))

    const timerId = setTimeout(() => {
      timerMap.delete(id)
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, duration)

    timerMap.set(id, timerId)

    return id
  },

  removeToast: (id) => {
    const timerId = timerMap.get(id)
    if (timerId !== undefined) {
      clearTimeout(timerId)
      timerMap.delete(id)
    }
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
})
