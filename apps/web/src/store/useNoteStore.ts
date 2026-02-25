import { create } from 'zustand'

interface NoteStore {
  selectedNoteId: string | null
  selectNote: (id: string | null) => void
}

export const useNoteStore = create<NoteStore>((set) => ({
  selectedNoteId: null,
  selectNote: (id) => set({ selectedNoteId: id }),
}))
