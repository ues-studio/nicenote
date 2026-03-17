import { describe, expect, it } from 'vitest'

import type { NoteSearchResult } from '@nicenote/shared'

import { mapToAppSearchResults } from './search-utils'

describe('mapToAppSearchResults', () => {
  const makeResult = (overrides: Partial<NoteSearchResult> = {}): NoteSearchResult => ({
    id: 'note-1',
    title: '测试笔记',
    folderId: 'folder-1',
    summary: '摘要',
    tags: ['tag1', 'tag2'],
    updatedAt: '2024-01-02T00:00:00+08:00',
    createdAt: '2024-01-01T00:00:00+08:00',
    snippet: '匹配片段',
    ...overrides,
  })

  it('正确映射搜索结果字段', () => {
    const results = mapToAppSearchResults([makeResult()])
    expect(results).toEqual([
      {
        id: 'note-1',
        title: '测试笔记',
        summary: '摘要',
        tags: ['tag1', 'tag2'],
        updatedAt: '2024-01-02T00:00:00+08:00',
        createdAt: '2024-01-01T00:00:00+08:00',
        snippet: '匹配片段',
      },
    ])
  })

  it('去除 folderId 字段', () => {
    const results = mapToAppSearchResults([makeResult({ folderId: 'should-be-removed' })])
    expect(results[0]).not.toHaveProperty('folderId')
  })

  it('tags 为 undefined 时兜底为空数组', () => {
    const input = makeResult()
    // 模拟运行时 tags 可能为 undefined 的情况
    ;(input as Record<string, unknown>).tags = undefined
    const results = mapToAppSearchResults([input as NoteSearchResult])
    expect(results[0].tags).toEqual([])
  })

  it('空数组输入返回空数组', () => {
    expect(mapToAppSearchResults([])).toEqual([])
  })

  it('正确处理多条结果', () => {
    const input = [
      makeResult({ id: '1', title: '第一篇' }),
      makeResult({ id: '2', title: '第二篇' }),
      makeResult({ id: '3', title: '第三篇' }),
    ]
    const results = mapToAppSearchResults(input)
    expect(results).toHaveLength(3)
    expect(results.map((r) => r.id)).toEqual(['1', '2', '3'])
  })
})
