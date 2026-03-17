import { describe, expect, it } from 'vitest'

import {
  noteCreateSchema,
  noteIdParamSchema,
  noteListItemSchema,
  noteListQuerySchema,
  noteSearchQuerySchema,
  noteSelectSchema,
  noteUpdateSchema,
} from './note'

describe('noteSelectSchema', () => {
  const validNote = {
    id: 'abc-123',
    title: '测试笔记',
    content: '# Hello',
    folderId: 'folder-1',
    createdAt: '2024-01-01T00:00:00+08:00',
    updatedAt: '2024-01-02T00:00:00+08:00',
  }

  it('接受有效的笔记数据', () => {
    expect(noteSelectSchema.parse(validNote)).toEqual(validNote)
  })

  it('content 可以为 null', () => {
    const result = noteSelectSchema.parse({ ...validNote, content: null })
    expect(result.content).toBeNull()
  })

  it('folderId 可以为 null', () => {
    const result = noteSelectSchema.parse({ ...validNote, folderId: null })
    expect(result.folderId).toBeNull()
  })

  it('拒绝超长标题', () => {
    expect(() => noteSelectSchema.parse({ ...validNote, title: 'a'.repeat(501) })).toThrow()
  })

  it('拒绝超长内容', () => {
    expect(() => noteSelectSchema.parse({ ...validNote, content: 'a'.repeat(100_001) })).toThrow()
  })

  it('拒绝无效日期格式', () => {
    expect(() => noteSelectSchema.parse({ ...validNote, createdAt: 'not-a-date' })).toThrow()
  })

  it('strict 模式拒绝额外字段', () => {
    expect(() => noteSelectSchema.parse({ ...validNote, extra: 'field' })).toThrow()
  })
})

describe('noteListItemSchema', () => {
  const validItem = {
    id: 'abc-123',
    title: '测试笔记',
    folderId: null,
    createdAt: '2024-01-01T00:00:00+08:00',
    updatedAt: '2024-01-02T00:00:00+08:00',
    summary: '摘要内容',
    tags: ['tag1', 'tag2'],
  }

  it('接受有效的列表项', () => {
    const result = noteListItemSchema.parse(validItem)
    expect(result.tags).toEqual(['tag1', 'tag2'])
  })

  it('tags 缺省时默认为空数组', () => {
    const { tags: _tags, ...withoutTags } = validItem
    const result = noteListItemSchema.parse(withoutTags)
    expect(result.tags).toEqual([])
  })

  it('不包含 content 字段', () => {
    const result = noteListItemSchema.parse(validItem)
    expect(result).not.toHaveProperty('content')
  })
})

describe('noteUpdateSchema', () => {
  it('接受仅更新标题', () => {
    expect(noteUpdateSchema.parse({ title: '新标题' })).toEqual({ title: '新标题' })
  })

  it('接受仅更新 tags', () => {
    const result = noteUpdateSchema.parse({ tags: ['a', 'b'] })
    expect(result.tags).toEqual(['a', 'b'])
  })

  it('拒绝空对象（至少需要一个字段）', () => {
    expect(() => noteUpdateSchema.parse({})).toThrow('At least one field must be provided')
  })

  it('拒绝额外字段', () => {
    expect(() => noteUpdateSchema.parse({ title: 'ok', extra: true })).toThrow()
  })
})

describe('noteCreateSchema', () => {
  it('接受空对象（所有字段可选）', () => {
    expect(noteCreateSchema.parse({})).toEqual({})
  })

  it('接受完整创建数据', () => {
    const input = { title: '新笔记', content: 'body', folderId: 'f1' }
    expect(noteCreateSchema.parse(input)).toEqual(input)
  })
})

describe('noteIdParamSchema', () => {
  it('接受非空 id', () => {
    expect(noteIdParamSchema.parse({ id: 'abc' })).toEqual({ id: 'abc' })
  })

  it('拒绝空 id', () => {
    expect(() => noteIdParamSchema.parse({ id: '' })).toThrow()
  })
})

describe('noteListQuerySchema', () => {
  it('使用默认 limit', () => {
    const result = noteListQuerySchema.parse({})
    expect(result.limit).toBe(50)
  })

  it('接受自定义 limit', () => {
    const result = noteListQuerySchema.parse({ limit: 10 })
    expect(result.limit).toBe(10)
  })

  it('拒绝超出范围的 limit', () => {
    expect(() => noteListQuerySchema.parse({ limit: 0 })).toThrow()
    expect(() => noteListQuerySchema.parse({ limit: 101 })).toThrow()
  })

  it('接受分页参数', () => {
    const result = noteListQuerySchema.parse({
      cursor: '2024-01-01T00:00:00+08:00',
      cursorId: 'note-1',
    })
    expect(result.cursor).toBe('2024-01-01T00:00:00+08:00')
    expect(result.cursorId).toBe('note-1')
  })
})

describe('noteSearchQuerySchema', () => {
  it('接受有效查询', () => {
    const result = noteSearchQuerySchema.parse({ q: 'hello' })
    expect(result.q).toBe('hello')
    expect(result.limit).toBe(20)
  })

  it('拒绝空查询', () => {
    expect(() => noteSearchQuerySchema.parse({ q: '' })).toThrow()
  })

  it('拒绝超长查询', () => {
    expect(() => noteSearchQuerySchema.parse({ q: 'a'.repeat(201) })).toThrow()
  })
})
