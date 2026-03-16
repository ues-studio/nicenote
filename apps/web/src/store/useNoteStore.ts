import { create } from 'zustand'

import type { NoteListItem, NoteSearchResult, NoteSelect, TagSelect } from '@nicenote/shared'
import { generateSummary } from '@nicenote/shared'

import { LocalStorageNoteRepository } from '../lib/local-storage-note-repository'

// ============================================================
// Repository 实例（通过 domain 层接口访问数据）
// ============================================================

const repo = new LocalStorageNoteRepository()

// ============================================================
// localStorage 辅助函数（仅用于标签，标签暂无 domain 接口）
// ============================================================

const TAGS_STORAGE_KEY = 'nicenote-tags'
const NOTE_TAGS_STORAGE_KEY = 'nicenote-note-tags'

function loadTags(): TagSelect[] {
  try {
    const raw = localStorage.getItem(TAGS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as TagSelect[]) : []
  } catch {
    return []
  }
}

function saveTags(tags: TagSelect[]) {
  localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags))
}

function loadNoteTags(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(NOTE_TAGS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
  } catch {
    return {}
  }
}

function saveNoteTags(noteTags: Record<string, string[]>) {
  localStorage.setItem(NOTE_TAGS_STORAGE_KEY, JSON.stringify(noteTags))
}

function toListItem(note: NoteSelect): NoteListItem {
  return {
    id: note.id,
    title: note.title,
    summary: generateSummary(note.content ?? '') || null,
    folderId: note.folderId,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    tags: [],
  }
}

interface NoteStore {
  notes: NoteSelect[]
  selectedNoteId: string | null
  isLoading: boolean
  tags: TagSelect[]
  noteTags: Record<string, string[]>
  loadNotes: () => Promise<void>
  selectNote: (id: string | null) => void
  createNote: () => Promise<string>
  updateNote: (id: string, patch: { title?: string; content?: string | null }) => void
  deleteNote: (id: string) => Promise<void>
  importNotes: (items: Array<{ title: string; content: string }>) => void
  search: (query: string) => NoteSearchResult[]
  createTag: (name: string) => TagSelect
  addTagToNote: (noteId: string, tagId: string) => void
  removeTagFromNote: (noteId: string, tagId: string) => void
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  selectedNoteId: null,
  isLoading: true,
  tags: loadTags(),
  noteTags: loadNoteTags(),

  loadNotes: async () => {
    set({ isLoading: true })
    try {
      const result = await repo.list({ limit: 100 })
      // list 返回 NoteListItem（无 content），需要获取完整 NoteSelect
      // 为了兼容现有代码，加载所有笔记的完整数据
      const notes: NoteSelect[] = []
      for (const item of result.data) {
        const full = await repo.get(item.id)
        if (full) notes.push(full)
      }
      set({ notes, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  selectNote: (id) => set({ selectedNoteId: id }),

  createNote: async () => {
    const note = await repo.create({ title: '' })
    set((state) => ({ notes: [note, ...state.notes], selectedNoteId: note.id }))
    return note.id
  },

  updateNote: (id, patch) => {
    // 乐观更新：立即更新本地状态
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
    )
    notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    set({ notes })

    // 后台持久化
    repo.update(id, patch).catch((err) => {
      console.error('保存笔记失败:', err)
    })
  },

  deleteNote: async (id) => {
    await repo.delete(id)
    const { notes, selectedNoteId } = get()
    set({
      notes: notes.filter((n) => n.id !== id),
      selectedNoteId: selectedNoteId === id ? null : selectedNoteId,
    })
  },

  importNotes: (items) => {
    // 批量导入仍使用同步方式（LocalStorageRepo 内部同步）
    const importPromises = items.map((item) =>
      repo.create({ title: item.title, content: item.content || null })
    )
    Promise.all(importPromises).then((newNotes) => {
      set((state) => ({ notes: [...newNotes, ...state.notes] }))
    })
  },

  search: (query) => {
    // 搜索是同步调用（LocalStorageNoteRepository 内部同步，Promise 立即 resolve）
    // 为了保持接口同步，直接用内联搜索
    const q = query.toLowerCase()
    const limit = 20
    const notes = get().notes
    const results: NoteSearchResult[] = []

    for (const note of notes) {
      if (results.length >= limit) break

      const content = note.content ?? ''
      const titleMatch = note.title.toLowerCase().includes(q)
      const contentIdx = content.toLowerCase().indexOf(q)

      if (!titleMatch && contentIdx === -1) continue

      let snippet = ''
      if (contentIdx !== -1) {
        const start = Math.max(0, contentIdx - 40)
        const end = Math.min(content.length, contentIdx + q.length + 60)
        const raw = content.slice(start, end)
        snippet = (start > 0 ? '…' : '') + raw + (end < content.length ? '…' : '')
      }

      results.push({
        id: note.id,
        title: note.title,
        summary: generateSummary(content) || null,
        folderId: note.folderId,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        tags: [],
        snippet,
      })
    }

    return results
  },

  createTag: (name) => {
    const tag: TagSelect = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color: null,
      createdAt: new Date().toISOString(),
    }
    const tags = [...get().tags, tag]
    saveTags(tags)
    set({ tags })
    return tag
  },

  addTagToNote: (noteId, tagId) => {
    const noteTags = { ...get().noteTags }
    const existing = noteTags[noteId] ?? []
    if (existing.includes(tagId)) return
    noteTags[noteId] = [...existing, tagId]
    saveNoteTags(noteTags)
    set({ noteTags })
  },

  removeTagFromNote: (noteId, tagId) => {
    const noteTags = { ...get().noteTags }
    const existing = noteTags[noteId] ?? []
    noteTags[noteId] = existing.filter((id) => id !== tagId)
    saveNoteTags(noteTags)
    set({ noteTags })
  },
}))

// 启动时加载笔记
useNoteStore.getState().loadNotes()

// 供组件使用的 selector
export const selectNoteList = (notes: NoteSelect[]): NoteListItem[] => notes.map(toListItem)
