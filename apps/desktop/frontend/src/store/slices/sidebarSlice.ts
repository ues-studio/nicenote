import type { StateCreator } from 'zustand'

import type { DesktopStore } from '../useDesktopStore'

const MIN_WIDTH = 260
const MAX_WIDTH = 560
const DEFAULT_WIDTH = 320
const WIDTH_STORAGE_KEY = 'nicenote-desktop-sidebar-width'
const OPEN_STORAGE_KEY = 'nicenote-desktop-sidebar-open'

function loadWidth(): number {
  try {
    const stored = localStorage.getItem(WIDTH_STORAGE_KEY)
    if (stored) {
      const parsed = Number(stored)
      if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) return parsed
    }
  } catch {
    // ignore
  }
  return DEFAULT_WIDTH
}

function loadIsOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

function saveIsOpen(value: boolean) {
  try {
    localStorage.setItem(OPEN_STORAGE_KEY, String(value))
  } catch {
    // ignore
  }
}

export interface SidebarSlice {
  sidebarOpen: boolean
  sidebarWidth: number
  isResizing: boolean
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  startResize: () => void
  stopResize: () => void
}

export const createSidebarSlice: StateCreator<DesktopStore, [], [], SidebarSlice> = (set) => ({
  sidebarOpen: loadIsOpen(),
  sidebarWidth: loadWidth(),
  isResizing: false,

  openSidebar: () => {
    saveIsOpen(true)
    set({ sidebarOpen: true })
  },

  closeSidebar: () => {
    saveIsOpen(false)
    set({ sidebarOpen: false })
  },

  toggleSidebar: () =>
    set((s) => {
      saveIsOpen(!s.sidebarOpen)
      return { sidebarOpen: !s.sidebarOpen }
    }),

  setSidebarWidth: (width: number) => {
    const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
    set({ sidebarWidth: clamped })
    try {
      localStorage.setItem(WIDTH_STORAGE_KEY, String(clamped))
    } catch {
      // ignore
    }
  },

  startResize: () => set({ isResizing: true }),
  stopResize: () => set({ isResizing: false }),
})
