import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  DEFAULT_NOTE_TITLE,
  generateSummary,
  type NoteListItem,
  type NoteSelect,
  noteSelectSchema,
  type NoteUpdateInput,
} from '@nicenote/shared'

import i18n from '../i18n'
import { api, throwApiError } from '../lib/api'
import { useNoteStore } from '../store/useNoteStore'
import { useToastStore } from '../store/useToastStore'

import { noteDetailQueryKey } from './useNoteDetail'
import { NOTES_QUERY_KEY } from './useNotesQuery'

// ── Cache types ──

type NotesPage = {
  data: NoteListItem[]
  nextCursor: string | null
  nextCursorId: string | null
}

type NotesInfiniteData = InfiniteData<NotesPage>

// ── Cache helpers (exported for useDebouncedNoteSave & NotesSidebar) ──

export function getNoteFromListCache(
  queryClient: QueryClient,
  id: string
): NoteListItem | undefined {
  const data = queryClient.getQueryData<NotesInfiniteData>(NOTES_QUERY_KEY)
  if (!data) return undefined
  for (const page of data.pages) {
    const note = page.data.find((n) => n.id === id)
    if (note) return note
  }
  return undefined
}

export function updateNoteInListCache(
  queryClient: QueryClient,
  id: string,
  updater: (note: NoteListItem) => NoteListItem
) {
  queryClient.setQueryData<NotesInfiniteData>(NOTES_QUERY_KEY, (old) => {
    if (!old) return old
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: page.data.map((note) => (note.id === id ? updater(note) : note)),
      })),
    }
  })
}

export function removeNoteFromListCache(queryClient: QueryClient, id: string) {
  queryClient.setQueryData<NotesInfiniteData>(NOTES_QUERY_KEY, (old) => {
    if (!old) return old
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: page.data.filter((note) => note.id !== id),
      })),
    }
  })
}

export function restoreNoteToListCache(queryClient: QueryClient, note: NoteListItem) {
  queryClient.setQueryData<NotesInfiniteData>(NOTES_QUERY_KEY, (old) => {
    if (!old || old.pages.length === 0) return old
    const allNotes = [...old.pages[0].data, note].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    return {
      ...old,
      pages: [{ ...old.pages[0], data: allNotes }, ...old.pages.slice(1)],
    }
  })
}

export function updateNoteLocal(queryClient: QueryClient, id: string, updates: NoteUpdateInput) {
  const now = new Date().toISOString()

  queryClient.setQueryData<NoteSelect>(noteDetailQueryKey(id), (old) => {
    if (!old) return old
    const patch: Partial<NoteSelect> = { updatedAt: now }
    if (updates.title !== undefined) patch.title = updates.title
    if (updates.content !== undefined) patch.content = updates.content
    return { ...old, ...patch }
  })

  updateNoteInListCache(queryClient, id, (note) => {
    const patch: Partial<NoteListItem> = { updatedAt: now }
    if (updates.title !== undefined) patch.title = updates.title
    if (updates.content !== undefined) patch.summary = generateSummary(updates.content ?? '')
    return { ...note, ...patch }
  })
}

// ── Save helper (used by useDebouncedNoteSave) ──

export async function saveNoteToServer(id: string, updates: NoteUpdateInput): Promise<NoteSelect> {
  const res = await api.notes[':id'].$patch({ param: { id }, json: updates })
  if (!res.ok) await throwApiError(res, `Save failed: ${res.status}`)
  const json = await res.json()
  const parsed = noteSelectSchema.safeParse(json)
  if (!parsed.success) throw new Error('Save returned invalid data')
  return parsed.data
}

// ── Mutations ──

export function useCreateNote() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: async () => {
      const res = await api.notes.$post({
        json: { title: DEFAULT_NOTE_TITLE, content: '' },
      })
      if (!res.ok) await throwApiError(res, `Create failed: ${res.status}`)
      const json = await res.json()
      const parsed = noteSelectSchema.safeParse(json)
      if (!parsed.success) throw new Error('Invalid note data')
      return parsed.data
    },
    onSuccess: (newNote) => {
      queryClient.setQueryData(noteDetailQueryKey(newNote.id), newNote)

      const listItem: NoteListItem = {
        id: newNote.id,
        title: newNote.title,
        summary: generateSummary(newNote.content ?? ''),
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt,
      }
      queryClient.setQueryData<NotesInfiniteData>(NOTES_QUERY_KEY, (old) => {
        if (!old || old.pages.length === 0) return old
        return {
          ...old,
          pages: [
            { ...old.pages[0], data: [listItem, ...old.pages[0].data] },
            ...old.pages.slice(1),
          ],
        }
      })

      useNoteStore.getState().selectNote(newNote.id)
    },
    onError: () => {
      addToast(i18n.t('store.networkErrorCreateNote'))
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.notes[':id'].$delete({ param: { id } })
      if (!res.ok) await throwApiError(res, `Delete failed: ${res.status}`)
    },
    onSuccess: (_, id) => {
      removeNoteFromListCache(queryClient, id)
      queryClient.removeQueries({ queryKey: noteDetailQueryKey(id) })
    },
    onError: () => {
      addToast(i18n.t('store.networkErrorDeleteNote'))
    },
  })
}
