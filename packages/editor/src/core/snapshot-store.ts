import { useSyncExternalStore } from 'react'

import type { NoteEditorStateSnapshot } from './state'
import { createEmptyEditorStateSnapshot } from './state'

export interface EditorSnapshotStore {
  get: () => NoteEditorStateSnapshot
  set: (next: NoteEditorStateSnapshot) => void
  subscribe: (listener: () => void) => () => void
}

export function createEditorSnapshotStore(): EditorSnapshotStore {
  let snapshot = createEmptyEditorStateSnapshot()
  const listeners = new Set<() => void>()

  return {
    get: () => snapshot,
    set: (next) => {
      snapshot = next
      for (const l of listeners) l()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function useEditorSnapshot(store: EditorSnapshotStore): NoteEditorStateSnapshot {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
