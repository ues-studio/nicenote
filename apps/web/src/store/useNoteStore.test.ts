import { beforeEach, describe, expect, it } from 'vitest'

import { useNoteStore } from './useNoteStore'

describe('useNoteStore', () => {
  beforeEach(() => {
    useNoteStore.setState({ selectedNoteId: null })
  })

  it('starts with no selected note', () => {
    expect(useNoteStore.getState().selectedNoteId).toBeNull()
  })

  it('selects a note by id', () => {
    useNoteStore.getState().selectNote('n1')
    expect(useNoteStore.getState().selectedNoteId).toBe('n1')
  })

  it('clears selection with null', () => {
    useNoteStore.getState().selectNote('n1')
    useNoteStore.getState().selectNote(null)
    expect(useNoteStore.getState().selectedNoteId).toBeNull()
  })

  it('replaces previous selection', () => {
    useNoteStore.getState().selectNote('n1')
    useNoteStore.getState().selectNote('n2')
    expect(useNoteStore.getState().selectedNoteId).toBe('n2')
  })
})
