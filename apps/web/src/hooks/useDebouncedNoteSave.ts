import { useCallback, useEffect, useRef } from 'react'

import { debounce, type NoteSelect, type NoteUpdateInput } from '@nicenote/shared'

import { useToastStore } from '../store/useToastStore'

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000]

interface UseDebouncedNoteSaveOptions {
  delayMs?: number
  saveNote: (id: string, updates: NoteUpdateInput) => Promise<NoteSelect>
}

type PendingSaveEntry = {
  updates: NoteUpdateInput
  debouncedSave: ReturnType<typeof debounce<() => void>>
  saving: boolean
}

async function attemptSave(
  saveNote: (id: string, updates: NoteUpdateInput) => Promise<NoteSelect>,
  id: string,
  updates: NoteUpdateInput
): Promise<boolean> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await saveNote(id, updates)
      return true
    } catch {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]))
      }
    }
  }
  return false
}

export function useDebouncedNoteSave({ saveNote, delayMs = 1000 }: UseDebouncedNoteSaveOptions) {
  const pendingSavesRef = useRef<Map<string, PendingSaveEntry>>(new Map())
  const saveNoteRef = useRef(saveNote)
  const addToast = useToastStore((state) => state.addToast)
  const addToastRef = useRef(addToast)

  useEffect(() => {
    saveNoteRef.current = saveNote
  }, [saveNote])

  useEffect(() => {
    addToastRef.current = addToast
  }, [addToast])

  const flushEntry = useCallback(async (id: string) => {
    const pending = pendingSavesRef.current.get(id)
    if (!pending || pending.saving) return

    const updates = pending.updates
    if (Object.keys(updates).length === 0) {
      pendingSavesRef.current.delete(id)
      return
    }

    pending.saving = true
    pending.updates = {}

    const success = await attemptSave(saveNoteRef.current, id, updates)

    if (success) {
      const current = pendingSavesRef.current.get(id)
      if (current && Object.keys(current.updates).length === 0) {
        pendingSavesRef.current.delete(id)
      } else if (current) {
        current.saving = false
      }
    } else {
      const current = pendingSavesRef.current.get(id)
      if (current) {
        current.updates = { ...updates, ...current.updates }
        current.saving = false
      }
      addToastRef.current('Failed to save note. Your changes may not be persisted.')
    }
  }, [])

  const cancelPendingSave = useCallback((id: string) => {
    const pending = pendingSavesRef.current.get(id)
    if (!pending) return
    pending.debouncedSave.cancel()
    pendingSavesRef.current.delete(id)
  }, [])

  const scheduleSave = useCallback(
    (id: string, updates: NoteUpdateInput) => {
      const pendingSaves = pendingSavesRef.current
      let entry = pendingSaves.get(id)

      if (!entry) {
        const debouncedSave = debounce(() => {
          void flushEntry(id)
        }, delayMs)

        entry = {
          updates: {},
          debouncedSave,
          saving: false,
        }
        pendingSaves.set(id, entry)
      }

      entry.updates = { ...entry.updates, ...updates }
      entry.debouncedSave()
    },
    [delayMs, flushEntry]
  )

  useEffect(() => {
    const pendingSaves = pendingSavesRef.current

    return () => {
      for (const [id, pending] of pendingSaves.entries()) {
        pending.debouncedSave.cancel()
        if (Object.keys(pending.updates).length === 0) continue
        void attemptSave(saveNoteRef.current, id, pending.updates)
      }

      pendingSaves.clear()
    }
  }, [saveNote])

  return {
    scheduleSave,
    cancelPendingSave,
  }
}
