import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  toggle: () => void
}

function getStorageKey(): string | null {
  if (typeof document === 'undefined') return null
  return document.documentElement.getAttribute('data-theme-storage-key')
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.setAttribute('data-theme', theme)

  const storageKey = getStorageKey()
  if (storageKey) {
    localStorage.setItem(storageKey, theme)
  }
}

function resolveInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: resolveInitialTheme(),
  toggle: () =>
    set((state) => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return { theme: next }
    }),
}))
