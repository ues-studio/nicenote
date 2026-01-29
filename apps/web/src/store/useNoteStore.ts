import { create } from 'zustand'
import { api } from '../lib/api'

export interface Note {
  id: string
  title: string
  content: string // Use string instead of null to match backend/Tiptap expectations
  createdAt: string | number | Date
  updatedAt: string | number | Date
}

interface NoteStore {
  notes: Note[]
  currentNote: Note | null
  isLoading: boolean
  fetchNotes: () => Promise<void>
  selectNote: (note: Note | null) => void
  createNote: () => Promise<void>
  updateNoteLocal: (id: string, updates: Partial<Note>) => void
  saveNote: (id: string, updates: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes: [],
  currentNote: null,
  isLoading: false,

  fetchNotes: async () => {
    set({ isLoading: true })
    try {
      const res = await api.notes.$get()
      if (res.ok) {
        const data = await res.json()
        set({ notes: data as Note[] })
      }
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
        json: { title: 'Untitled', content: '' }
      })
      if (res.ok) {
        const newNote = await res.json() as Note
        set((state) => ({ 
          notes: [newNote, ...state.notes],
          currentNote: newNote 
        }))
      }
    } finally {
      set({ isLoading: false })
    }
  },

  updateNoteLocal: (id, updates) => {
    set((state) => {
      const newNotes = state.notes.map((n) => 
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
      const newCurrentNote = state.currentNote?.id === id 
        ? { ...state.currentNote, ...updates, updatedAt: new Date().toISOString() } 
        : state.currentNote
      
      return { notes: newNotes, currentNote: newCurrentNote }
    })
  },

  saveNote: async (id, updates) => {
    try {
      // Ensure content is a string
      const jsonUpdates: any = { ...updates }
      if (jsonUpdates.content === null || jsonUpdates.content === undefined) {
        delete jsonUpdates.content
      }
      
      await api.notes[':id'].$patch({
        param: { id },
        json: jsonUpdates
      })
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  },

  deleteNote: async (id) => {
    try {
      const res = await api.notes[':id'].$delete({
        param: { id }
      })
      if (res.ok) {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          currentNote: state.currentNote?.id === id ? null : state.currentNote
        }))
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }
}))
