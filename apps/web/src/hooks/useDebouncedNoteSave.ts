import { useCallback, useEffect, useRef } from 'react'

import { debounce, type NoteUpdateInput } from '@nicenote/shared'

interface UseDebouncedNoteSaveOptions {
  delayMs?: number
  saveNote: (id: string, updates: NoteUpdateInput) => Promise<void>
}

type PendingSaveEntry = {
  updates: NoteUpdateInput
  debouncedSave: ReturnType<typeof debounce<() => void>>
}

export function useDebouncedNoteSave({ saveNote, delayMs = 1000 }: UseDebouncedNoteSaveOptions) {
  const pendingSavesRef = useRef<Map<string, PendingSaveEntry>>(new Map())
  const saveNoteRef = useRef(saveNote)

  useEffect(() => {
    saveNoteRef.current = saveNote
  }, [saveNote])

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
          const pending = pendingSavesRef.current.get(id)
          if (!pending) return

          pendingSavesRef.current.delete(id)
          if (Object.keys(pending.updates).length === 0) return
          void saveNoteRef.current(id, pending.updates)
        }, delayMs)

        entry = {
          updates: {},
          debouncedSave,
        }
        pendingSaves.set(id, entry)
      }

      entry.updates = { ...entry.updates, ...updates }
      entry.debouncedSave()
    },
    [delayMs]
  )

  useEffect(() => {
    const pendingSaves = pendingSavesRef.current

    return () => {
      for (const [id, pending] of pendingSaves.entries()) {
        pending.debouncedSave.cancel()
        if (Object.keys(pending.updates).length === 0) continue
        void saveNoteRef.current(id, pending.updates)
      }

      pendingSaves.clear()
    }
  }, [saveNote])

  return {
    scheduleSave,
    cancelPendingSave,
  }
}
