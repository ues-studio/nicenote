import { useCallback, useEffect, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { debounce, type NoteSelect, type NoteUpdateInput } from '@nicenote/shared'

import i18n from '../i18n'
import { useToastStore } from '../store/useToastStore'

import { noteDetailQueryKey } from './useNoteDetail'
import { getNoteFromListCache, saveNoteToServer, updateNoteInListCache } from './useNoteMutations'

export const MAX_RETRIES = 3
export const RETRY_DELAYS = [1000, 2000, 4000]
const SAVED_DISPLAY_MS = 2000

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved'

type PendingSaveEntry = {
  updates: NoteUpdateInput
  debouncedSave: ReturnType<typeof debounce<() => void>>
  saving: boolean
}

export async function attemptSave(
  id: string,
  updates: NoteUpdateInput
): Promise<NoteSelect | null> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await saveNoteToServer(id, updates)
    } catch {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]))
      }
    }
  }
  return null
}

export function useDebouncedNoteSave({ delayMs = 1000 }: { delayMs?: number } = {}) {
  const queryClient = useQueryClient()
  const pendingSavesRef = useRef<Map<string, PendingSaveEntry>>(new Map())
  const addToast = useToastStore((state) => state.addToast)
  const addToastRef = useRef(addToast)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    addToastRef.current = addToast
  }, [addToast])

  const flushEntry = useCallback(
    async (id: string) => {
      const pending = pendingSavesRef.current.get(id)
      if (!pending || pending.saving) return

      const updates = pending.updates
      if (Object.keys(updates).length === 0) {
        pendingSavesRef.current.delete(id)
        return
      }

      // Snapshot before save — used for rollback if all retries fail
      const detailSnapshot = queryClient.getQueryData<NoteSelect>(noteDetailQueryKey(id))
      const listItemSnapshot = getNoteFromListCache(queryClient, id)

      pending.saving = true
      pending.updates = {}
      setSaveStatus('saving')

      const saved = await attemptSave(id, updates)

      if (saved) {
        // Sync server timestamps back into caches
        const serverFields = { updatedAt: saved.updatedAt, createdAt: saved.createdAt }
        queryClient.setQueryData<NoteSelect>(noteDetailQueryKey(id), (old) =>
          old ? { ...old, ...serverFields } : old
        )
        updateNoteInListCache(queryClient, id, (note) => ({ ...note, ...serverFields }))

        const current = pendingSavesRef.current.get(id)
        if (current && Object.keys(current.updates).length > 0) {
          current.saving = false
          setSaveStatus('unsaved')
          current.debouncedSave()
        } else if (current) {
          pendingSavesRef.current.delete(id)
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
          setSaveStatus('saved')
          savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), SAVED_DISPLAY_MS)
        }
      } else {
        // All retries exhausted — roll back to pre-save snapshot
        if (detailSnapshot) {
          queryClient.setQueryData(noteDetailQueryKey(id), detailSnapshot)
        }
        if (listItemSnapshot) {
          updateNoteInListCache(queryClient, id, () => listItemSnapshot)
        }

        const current = pendingSavesRef.current.get(id)
        if (current) {
          current.updates = { ...updates, ...current.updates }
          current.saving = false
        }
        setSaveStatus('unsaved')
        addToastRef.current(i18n.t('toast.failedToSave'))
      }
    },
    [queryClient]
  )

  const cancelPendingSave = useCallback((id: string) => {
    const pending = pendingSavesRef.current.get(id)
    if (!pending) return
    pending.debouncedSave.cancel()
    pendingSavesRef.current.delete(id)
    if (pendingSavesRef.current.size === 0) {
      setSaveStatus('idle')
    }
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
      setSaveStatus('unsaved')
      entry.debouncedSave()
    },
    [delayMs, flushEntry]
  )

  useEffect(() => {
    const pendingSaves = pendingSavesRef.current

    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)

      for (const [id, pending] of pendingSaves.entries()) {
        pending.debouncedSave.cancel()
        if (Object.keys(pending.updates).length === 0) continue
        void attemptSave(id, pending.updates)
      }

      pendingSaves.clear()
    }
  }, [])

  return {
    scheduleSave,
    cancelPendingSave,
    saveStatus,
  }
}
