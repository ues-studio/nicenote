import type { StateCreator } from 'zustand'

import type { NoteSearchResult } from '@nicenote/shared'

import { getCurrentRepo } from '../../lib/repository-provider'
import type { DesktopStore } from '../useDesktopStore'

export interface SearchSlice {
  searchOpen: boolean
  searchQuery: string
  searchResults: NoteSearchResult[]
  isSearching: boolean
  setSearchOpen: (open: boolean) => void
  search: (query: string) => Promise<void>
}

export const createSearchSlice: StateCreator<DesktopStore, [], [], SearchSlice> = (set, _get) => ({
  searchOpen: false,
  searchQuery: '',
  searchResults: [],
  isSearching: false,

  setSearchOpen: (open: boolean) => {
    set({ searchOpen: open })
    if (!open) {
      set({ searchQuery: '', searchResults: [] })
    }
  },

  search: async (query: string) => {
    set({ searchQuery: query })
    const repo = getCurrentRepo()
    if (!query.trim() || !repo) {
      set({ searchResults: [] })
      return
    }

    set({ isSearching: true })
    try {
      const results = await repo.search({ q: query, limit: 20 })
      set({ searchResults: results })
    } catch (err) {
      console.error('搜索失败:', err)
      set({ searchResults: [] })
    } finally {
      set({ isSearching: false })
    }
  },
})
