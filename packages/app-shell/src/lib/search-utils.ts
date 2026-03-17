import type { NoteSearchResult } from '@nicenote/shared'

import type { AppSearchResult } from '../types'

/** 将 NoteSearchResult 映射为 AppSearchResult（去除 folderId，tags 兜底为空数组） */
export function mapToAppSearchResults(results: NoteSearchResult[]): AppSearchResult[] {
  return results.map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    tags: r.tags ?? [],
    updatedAt: r.updatedAt,
    createdAt: r.createdAt,
    snippet: r.snippet,
  }))
}
