import { describe, expect, it } from 'vitest'

import {
  folderCreateSchema,
  folderIdParamSchema,
  folderSelectSchema,
  folderUpdateSchema,
} from './folder'

describe('folderSelectSchema', () => {
  const validFolder = {
    id: 'folder-1',
    name: '我的文件夹',
    parentId: null,
    position: 0,
    createdAt: '2024-01-01T00:00:00+08:00',
    updatedAt: '2024-01-02T00:00:00+08:00',
  }

  it('接受有效的文件夹数据', () => {
    expect(folderSelectSchema.parse(validFolder)).toEqual(validFolder)
  })

  it('parentId 可以为非空字符串', () => {
    const result = folderSelectSchema.parse({ ...validFolder, parentId: 'parent-1' })
    expect(result.parentId).toBe('parent-1')
  })

  it('拒绝超长名称', () => {
    expect(() => folderSelectSchema.parse({ ...validFolder, name: 'a'.repeat(201) })).toThrow()
  })

  it('拒绝无效日期格式', () => {
    expect(() => folderSelectSchema.parse({ ...validFolder, createdAt: 'not-a-date' })).toThrow()
  })

  it('拒绝非整数 position', () => {
    expect(() => folderSelectSchema.parse({ ...validFolder, position: 1.5 })).toThrow()
  })

  it('strict 模式拒绝额外字段', () => {
    expect(() => folderSelectSchema.parse({ ...validFolder, extra: true })).toThrow()
  })
})

describe('folderCreateSchema', () => {
  it('接受有效创建数据', () => {
    const input = { name: '新文件夹' }
    expect(folderCreateSchema.parse(input)).toEqual(input)
  })

  it('接受带 parentId 的创建数据', () => {
    const input = { name: '子文件夹', parentId: 'parent-1' }
    expect(folderCreateSchema.parse(input)).toEqual(input)
  })

  it('parentId 可以为 null', () => {
    const result = folderCreateSchema.parse({ name: '根文件夹', parentId: null })
    expect(result.parentId).toBeNull()
  })

  it('拒绝空名称', () => {
    expect(() => folderCreateSchema.parse({ name: '' })).toThrow()
  })

  it('拒绝超长名称', () => {
    expect(() => folderCreateSchema.parse({ name: 'a'.repeat(201) })).toThrow()
  })

  it('拒绝缺少 name 字段', () => {
    expect(() => folderCreateSchema.parse({})).toThrow()
  })
})

describe('folderUpdateSchema', () => {
  it('接受仅更新名称', () => {
    expect(folderUpdateSchema.parse({ name: '新名称' })).toEqual({ name: '新名称' })
  })

  it('接受仅更新 parentId', () => {
    const result = folderUpdateSchema.parse({ parentId: 'new-parent' })
    expect(result.parentId).toBe('new-parent')
  })

  it('接受仅更新 position', () => {
    const result = folderUpdateSchema.parse({ position: 3 })
    expect(result.position).toBe(3)
  })

  it('拒绝空对象（至少需要一个字段）', () => {
    expect(() => folderUpdateSchema.parse({})).toThrow('At least one field must be provided')
  })

  it('拒绝负数 position', () => {
    expect(() => folderUpdateSchema.parse({ position: -1 })).toThrow()
  })

  it('拒绝额外字段', () => {
    expect(() => folderUpdateSchema.parse({ name: 'ok', extra: true })).toThrow()
  })
})

describe('folderIdParamSchema', () => {
  it('接受非空 id', () => {
    expect(folderIdParamSchema.parse({ id: 'abc' })).toEqual({ id: 'abc' })
  })

  it('拒绝空 id', () => {
    expect(() => folderIdParamSchema.parse({ id: '' })).toThrow()
  })

  it('拒绝额外字段', () => {
    expect(() => folderIdParamSchema.parse({ id: 'abc', extra: true })).toThrow()
  })
})
