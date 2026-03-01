import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

function getStorageKey(): string | null {
  if (typeof document === 'undefined') return null
  return document.documentElement.getAttribute('data-theme-storage-key')
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  root.classList.toggle('dark', isDark)
  root.setAttribute('data-theme', isDark ? 'dark' : 'light')

  const storageKey = getStorageKey()
  if (storageKey) {
    localStorage.setItem(storageKey, theme)
  }
}

function resolveInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'system'
  const storageKey = getStorageKey()
  if (storageKey) {
    const saved = localStorage.getItem(storageKey)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  }
  return 'system'
}

// 跟随系统主题时的媒体查询监听器
let mediaQuery: MediaQueryList | null = null
let mediaListener: ((e: MediaQueryListEvent) => void) | null = null

function setupSystemListener() {
  if (typeof window === 'undefined') return
  cleanupSystemListener()
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaListener = (e: MediaQueryListEvent) => {
    const root = document.documentElement
    root.classList.toggle('dark', e.matches)
    root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
  }
  mediaQuery.addEventListener('change', mediaListener)
}

function cleanupSystemListener() {
  if (mediaQuery && mediaListener) {
    mediaQuery.removeEventListener('change', mediaListener)
    mediaQuery = null
    mediaListener = null
  }
}

const initialTheme = resolveInitialTheme()
if (initialTheme === 'system' && typeof window !== 'undefined') {
  setupSystemListener()
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: initialTheme,
  setTheme: (theme: Theme) => {
    if (theme === 'system') {
      setupSystemListener()
    } else {
      cleanupSystemListener()
    }
    applyTheme(theme)
    set({ theme })
  },
}))
