import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { NoteSelect } from '@nicenote/shared'

import { attemptSave, MAX_RETRIES, RETRY_DELAYS } from './useDebouncedNoteSave'

const savedNote: NoteSelect = {
  id: 'n1',
  title: 'T',
  content: '',
  createdAt: '2026-02-14T00:00:00.000Z',
  updatedAt: '2026-02-14T00:00:00.000Z',
}

let saveResponses: Array<'success' | 'failure'> = []
let saveCallCount = 0

vi.mock('./useNoteMutations', () => ({
  saveNoteToServer: vi.fn(async () => {
    const response = saveResponses[saveCallCount++] ?? 'failure'
    if (response === 'failure') throw new Error('save failed')
    return savedNote
  }),
  getNoteFromListCache: vi.fn(),
  updateNoteInListCache: vi.fn(),
}))

describe('attemptSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    saveCallCount = 0
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns saved note on first successful call', async () => {
    saveResponses = ['success']
    const result = await attemptSave('n1', { title: 'T' })

    expect(result).toEqual(savedNote)
  })

  it('retries on failure and returns saved note when a retry succeeds', async () => {
    saveResponses = ['failure', 'failure', 'success']

    const promise = attemptSave('n1', { title: 'T' })

    await vi.advanceTimersByTimeAsync(RETRY_DELAYS[0])
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS[1])

    const result = await promise
    expect(result).toEqual(savedNote)
    expect(saveCallCount).toBe(MAX_RETRIES)
  })

  it('returns null after all retries exhausted', async () => {
    saveResponses = ['failure', 'failure', 'failure']

    const promise = attemptSave('n1', { title: 'T' })

    await vi.advanceTimersByTimeAsync(RETRY_DELAYS[0])
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS[1])

    const result = await promise
    expect(result).toBeNull()
    expect(saveCallCount).toBe(MAX_RETRIES)
  })

  it('waits RETRY_DELAYS[0] ms before first retry', async () => {
    saveResponses = ['failure', 'success']

    const promise = attemptSave('n1', { title: 'T' })
    expect(saveCallCount).toBe(1)

    await vi.advanceTimersByTimeAsync(RETRY_DELAYS[0] - 1)
    expect(saveCallCount).toBe(1)

    await vi.advanceTimersByTimeAsync(1)
    await promise
    expect(saveCallCount).toBe(2)
  })
})
