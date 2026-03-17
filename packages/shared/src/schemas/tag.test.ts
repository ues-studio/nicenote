import { describe, expect, it } from 'vitest'

import {
  noteTagParamSchema,
  tagCreateSchema,
  tagIdParamSchema,
  tagSelectSchema,
  tagUpdateSchema,
} from './tag'

describe('tagSelectSchema', () => {
  const validTag = {
    id: 'tag-1',
    name: 'Rust',
    color: '#ff5733',
    createdAt: '2024-01-01T00:00:00+08:00',
  }

  it('接受有效的标签数据', () => {
    expect(tagSelectSchema.parse(validTag)).toEqual(validTag)
  })

  it('color 可以为 null', () => {
    const result = tagSelectSchema.parse({ ...validTag, color: null })
    expect(result.color).toBeNull()
  })

  it('拒绝超长名称', () => {
    expect(() => tagSelectSchema.parse({ ...validTag, name: 'a'.repeat(51) })).toThrow()
  })

  it('拒绝无效颜色格式（缺少 #）', () => {
    expect(() => tagSelectSchema.parse({ ...validTag, color: 'ff5733' })).toThrow()
  })

  it('拒绝无效颜色格式（长度不对）', () => {
    expect(() => tagSelectSchema.parse({ ...validTag, color: '#fff' })).toThrow()
  })

  it('拒绝无效日期格式', () => {
    expect(() => tagSelectSchema.parse({ ...validTag, createdAt: 'not-a-date' })).toThrow()
  })

  it('strict 模式拒绝额外字段', () => {
    expect(() => tagSelectSchema.parse({ ...validTag, extra: true })).toThrow()
  })
})

describe('tagCreateSchema', () => {
  it('接受仅名称', () => {
    expect(tagCreateSchema.parse({ name: 'TypeScript' })).toEqual({ name: 'TypeScript' })
  })

  it('接受名称和颜色', () => {
    const input = { name: 'React', color: '#61dafb' }
    expect(tagCreateSchema.parse(input)).toEqual(input)
  })

  it('color 可以为 null', () => {
    const result = tagCreateSchema.parse({ name: 'Go', color: null })
    expect(result.color).toBeNull()
  })

  it('拒绝空名称', () => {
    expect(() => tagCreateSchema.parse({ name: '' })).toThrow()
  })

  it('拒绝超长名称', () => {
    expect(() => tagCreateSchema.parse({ name: 'a'.repeat(51) })).toThrow()
  })

  it('拒绝缺少 name 字段', () => {
    expect(() => tagCreateSchema.parse({})).toThrow()
  })
})

describe('tagUpdateSchema', () => {
  it('接受仅更新名称', () => {
    expect(tagUpdateSchema.parse({ name: '新标签名' })).toEqual({ name: '新标签名' })
  })

  it('接受仅更新颜色', () => {
    const result = tagUpdateSchema.parse({ color: '#aabbcc' })
    expect(result.color).toBe('#aabbcc')
  })

  it('接受将颜色置为 null', () => {
    const result = tagUpdateSchema.parse({ color: null })
    expect(result.color).toBeNull()
  })

  it('拒绝空对象（至少需要一个字段）', () => {
    expect(() => tagUpdateSchema.parse({})).toThrow('At least one field must be provided')
  })

  it('拒绝额外字段', () => {
    expect(() => tagUpdateSchema.parse({ name: 'ok', extra: true })).toThrow()
  })
})

describe('tagIdParamSchema', () => {
  it('接受非空 id', () => {
    expect(tagIdParamSchema.parse({ id: 'tag-1' })).toEqual({ id: 'tag-1' })
  })

  it('拒绝空 id', () => {
    expect(() => tagIdParamSchema.parse({ id: '' })).toThrow()
  })
})

describe('noteTagParamSchema', () => {
  it('接受有效的 id 和 tagId', () => {
    const input = { id: 'note-1', tagId: 'tag-1' }
    expect(noteTagParamSchema.parse(input)).toEqual(input)
  })

  it('拒绝空 id', () => {
    expect(() => noteTagParamSchema.parse({ id: '', tagId: 'tag-1' })).toThrow()
  })

  it('拒绝空 tagId', () => {
    expect(() => noteTagParamSchema.parse({ id: 'note-1', tagId: '' })).toThrow()
  })
})
