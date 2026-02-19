import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    notes: {
      $get: vi.fn(),
      $post: vi.fn(),
      ':id': {
        $get: vi.fn(),
        $patch: vi.fn(),
        $delete: vi.fn(),
      },
    },
  },
}))

vi.mock('../lib/api', () => ({
  api: mockApi,
}))

import { useNoteStore } from './useNoteStore'

function resetStore() {
  useNoteStore.setState({
    notes: [],
    currentNote: null,
    isFetching: false,
    isCreating: false,
    error: null,
  })
}

describe('useNoteStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('fetches and normalizes notes list', async () => {
    mockApi.notes.$get.mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              id: 'n1',
              title: 'First',
              createdAt: '2026-02-14T01:02:03.000Z',
              updatedAt: '2026-02-14T01:02:03.000Z',
            },
            {
              id: '',
              title: 'Invalid',
            },
          ],
          nextCursor: null,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    await useNoteStore.getState().fetchNotes()

    const state = useNoteStore.getState()
    expect(state.isFetching).toBe(false)
    expect(state.error).toBeNull()
    expect(state.notes).toHaveLength(1)
    expect(state.notes[0]?.id).toBe('n1')
  })

  it('creates a note and sets it as current', async () => {
    mockApi.notes.$post.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'n-new',
          title: 'Untitled',
          content: '',
          createdAt: '2026-02-14T01:02:03.000Z',
          updatedAt: '2026-02-14T01:02:03.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    await useNoteStore.getState().createNote()

    const state = useNoteStore.getState()
    expect(state.notes[0]?.id).toBe('n-new')
    expect(state.currentNote?.id).toBe('n-new')
    expect(state.isCreating).toBe(false)
  })

  it('updates note locally and patches remote note', async () => {
    useNoteStore.setState({
      notes: [
        {
          id: 'n1',
          title: 'Before',
          createdAt: '2026-02-14T01:02:03.000Z',
          updatedAt: '2026-02-14T01:02:03.000Z',
        },
      ],
      currentNote: {
        id: 'n1',
        title: 'Before',
        content: 'A',
        createdAt: '2026-02-14T01:02:03.000Z',
        updatedAt: '2026-02-14T01:02:03.000Z',
      },
    })

    useNoteStore.getState().updateNoteLocal('n1', { title: 'After' })

    const localState = useNoteStore.getState()
    expect(localState.notes[0]?.title).toBe('After')
    expect(localState.currentNote?.title).toBe('After')

    mockApi.notes[':id'].$patch.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'n1',
          title: 'After',
          content: 'A',
          createdAt: '2026-02-14T01:02:03.000Z',
          updatedAt: '2026-02-14T01:02:03.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    await useNoteStore.getState().saveNote('n1', { title: 'After' })
    expect(mockApi.notes[':id'].$patch).toHaveBeenCalledWith({
      param: { id: 'n1' },
      json: { title: 'After' },
    })
  })

  it('deletes note and clears current note when matched', async () => {
    mockApi.notes[':id'].$delete.mockResolvedValue(new Response(null, { status: 200 }))

    useNoteStore.setState({
      notes: [
        {
          id: 'n1',
          title: 'First',
          createdAt: '2026-02-14T01:02:03.000Z',
          updatedAt: '2026-02-14T01:02:03.000Z',
        },
      ],
      currentNote: {
        id: 'n1',
        title: 'First',
        content: 'A',
        createdAt: '2026-02-14T01:02:03.000Z',
        updatedAt: '2026-02-14T01:02:03.000Z',
      },
    })

    await useNoteStore.getState().deleteNote('n1')
    const state = useNoteStore.getState()

    expect(state.notes).toHaveLength(0)
    expect(state.currentNote).toBeNull()
  })
})
