import { useQuery } from '@tanstack/react-query'

import { noteSelectSchema } from '@nicenote/shared'

import { api, throwApiError } from '../lib/api'

export function noteDetailQueryKey(id: string) {
  return ['notes', id] as const
}

export function useNoteDetail(id: string | null) {
  return useQuery({
    queryKey: noteDetailQueryKey(id!),
    queryFn: async ({ signal }) => {
      const res = await api.notes[':id'].$get({ param: { id: id! } }, { init: { signal } })
      if (!res.ok) await throwApiError(res, `Failed to fetch note: ${res.status}`)
      const json = await res.json()
      const parsed = noteSelectSchema.safeParse(json)
      if (!parsed.success) throw new Error('Invalid note data')
      return parsed.data
    },
    enabled: !!id,
  })
}
