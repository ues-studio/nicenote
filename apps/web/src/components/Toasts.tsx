import { X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import { useToastStore } from '../store/useToastStore'

export function Toasts() {
  const { toasts, removeToast } = useToastStore(
    useShallow((state) => ({
      toasts: state.toasts,
      removeToast: state.removeToast,
    }))
  )

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground shadow-lg backdrop-blur-sm"
          role="alert"
        >
          <span className="flex-1">{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick()
                removeToast(toast.id)
              }}
              className="shrink-0 rounded px-2 py-0.5 font-medium text-primary transition-colors hover:bg-primary/10"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
