import { describe, expect, it } from 'vitest'

import { isoDateTimeSchema } from './common'

describe('isoDateTimeSchema', () => {
  it('接受带时区偏移的 ISO 日期时间', () => {
    expect(isoDateTimeSchema.safeParse('2024-01-15T10:30:00+08:00').success).toBe(true)
    expect(isoDateTimeSchema.safeParse('2024-01-15T10:30:00-05:00').success).toBe(true)
  })

  it('接受 UTC 时间（Z 后缀）', () => {
    expect(isoDateTimeSchema.safeParse('2024-01-15T10:30:00Z').success).toBe(true)
  })

  it('拒绝不带时区的日期时间', () => {
    expect(isoDateTimeSchema.safeParse('2024-01-15T10:30:00').success).toBe(false)
  })

  it('拒绝纯日期', () => {
    expect(isoDateTimeSchema.safeParse('2024-01-15').success).toBe(false)
  })

  it('拒绝空字符串', () => {
    expect(isoDateTimeSchema.safeParse('').success).toBe(false)
  })

  it('拒绝非字符串类型', () => {
    expect(isoDateTimeSchema.safeParse(12345).success).toBe(false)
    expect(isoDateTimeSchema.safeParse(null).success).toBe(false)
  })

  it('拒绝无效格式', () => {
    expect(isoDateTimeSchema.safeParse('not-a-date').success).toBe(false)
    expect(isoDateTimeSchema.safeParse('2024/01/15T10:30:00Z').success).toBe(false)
  })
})
