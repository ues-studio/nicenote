import { create } from 'zustand'

import type { NoteSelect, NoteUpdateInput } from '@nicenote/shared'

import { api } from '../lib/api'

interface NoteStore {
  notes: NoteSelect[]
  currentNote: NoteSelect | null
  isLoading: boolean
  fetchNotes: () => Promise<void>
  selectNote: (note: NoteSelect | null) => void
  createNote: () => Promise<void>
  updateNoteLocal: (id: string, updates: NoteUpdateInput) => void
  saveNote: (id: string, updates: NoteUpdateInput) => Promise<NoteSelect>
  deleteNote: (id: string) => Promise<void>
}

function toIsoNow() {
  return new Date().toISOString()
}

function normalizeNote(raw: unknown): NoteSelect | null {
  if (typeof raw !== 'object' || raw === null) return null

  const data = raw as Record<string, unknown>
  const id = typeof data.id === 'string' ? data.id : ''
  if (!id) return null

  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : toIsoNow()
  const updatedAt = typeof data.updatedAt === 'string' ? data.updatedAt : createdAt

  return {
    id,
    title: typeof data.title === 'string' ? data.title : 'Untitled',
    content: typeof data.content === 'string' ? data.content : '',
    createdAt,
    updatedAt,
  }
}

function normalizeNoteList(raw: unknown): NoteSelect[] {
  if (!Array.isArray(raw)) return []

  return raw.reduce<NoteSelect[]>((notes, item) => {
    const normalized = normalizeNote(item)
    if (normalized) {
      notes.push(normalized)
    }
    return notes
  }, [])
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes: [],
  currentNote: null,
  isLoading: false,

  fetchNotes: async () => {
    set({ isLoading: true })
    try {
      const res = await api.notes.$get({ query: {} })
      if (res.ok) {
        const json = await res.json()
        set({ notes: normalizeNoteList(json.data) })
      } else {
        console.error('Failed to fetch notes:', res.status)
      }
    } catch (error) {
      console.error('Network error while fetching notes:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  selectNote: (note) => {
    set({ currentNote: note })
  },

  createNote: async () => {
    set({ isLoading: true })
    try {
      const res = await api.notes.$post({
        json: { title: 'Untitled', content: '' },
      })
      if (res.ok) {
        const newNote = normalizeNote(await res.json())
        if (!newNote) {
          console.error('Failed to normalize created note response')
          return
        }

        set((state) => ({
          notes: [newNote, ...state.notes],
          currentNote: newNote,
        }))
      } else {
        const errorText = await res.text()
        console.error('Failed to create note:', res.status, errorText)
      }
    } catch (error) {
      console.error('Error creating note:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  updateNoteLocal: (id, updates) => {
    set((state) => {
      const newNotes = state.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
      const newCurrentNote =
        state.currentNote?.id === id
          ? { ...state.currentNote, ...updates, updatedAt: new Date().toISOString() }
          : state.currentNote

      return { notes: newNotes, currentNote: newCurrentNote }
    })
  },

  saveNote: async (id, updates) => {
    const res = await api.notes[':id'].$patch({
      param: { id },
      json: updates,
    })

    if (!res.ok) {
      throw new Error(`Save failed: ${res.status}`)
    }

    const saved = normalizeNote(await res.json())
    if (!saved) {
      throw new Error('Save returned invalid data')
    }

    set((state) => {
      const serverFields = { updatedAt: saved.updatedAt, createdAt: saved.createdAt }
      const notes = state.notes.map((n) => (n.id === saved.id ? { ...n, ...serverFields } : n))
      const currentNote =
        state.currentNote?.id === saved.id
          ? { ...state.currentNote, ...serverFields }
          : state.currentNote
      return { notes, currentNote }
    })

    return saved
  },

  deleteNote: async (id) => {
    try {
      const res = await api.notes[':id'].$delete({
        param: { id },
      })
      if (res.ok) {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          currentNote: state.currentNote?.id === id ? null : state.currentNote,
        }))
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  },
}))
