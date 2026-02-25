import { useInfiniteQuery } from '@tanstack/react-query'

import { noteListItemSchema } from '@nicenote/shared'

import { api, throwApiError } from '../lib/api'

export const NOTES_QUERY_KEY = ['notes'] as const

export function useNotesQuery() {
  return useInfiniteQuery({
    queryKey: NOTES_QUERY_KEY,
    queryFn: async ({ pageParam }) => {
      const query: Record<string, string> = {}
      if (pageParam) {
        query.cursor = pageParam.cursor
        query.cursorId = pageParam.cursorId
      }
      const res = await api.notes.$get({ query })
      if (!res.ok) await throwApiError(res, `Failed to fetch notes: ${res.status}`)
      const json = await res.json()
      const parsed = noteListItemSchema.array().safeParse(json.data)
      if (!parsed.success) throw new Error('Invalid notes data')
      return {
        data: parsed.data,
        nextCursor: json.nextCursor,
        nextCursorId: json.nextCursorId,
      }
    },
    initialPageParam: null as { cursor: string; cursorId: string } | null,
    getNextPageParam: (lastPage) =>
      lastPage.nextCursor && lastPage.nextCursorId
        ? { cursor: lastPage.nextCursor, cursorId: lastPage.nextCursorId }
        : undefined,
  })
}
