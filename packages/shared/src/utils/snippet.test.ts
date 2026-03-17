import { describe, expect, it } from 'vitest'

import { extractSnippet } from './snippet'

describe('extractSnippet', () => {
  it('返回包含关键词的上下文片段', () => {
    const content = 'Hello world, this is a test content for snippet extraction.'
    const result = extractSnippet(content, 'test')
    expect(result).toContain('test')
  })

  it('关键词未找到时返回空字符串', () => {
    expect(extractSnippet('Hello world', 'xyz')).toBe('')
  })

  it('大小写不敏感匹配', () => {
    const result = extractSnippet('Hello WORLD', 'world')
    expect(result).toContain('WORLD')
  })

  it('空内容返回空字符串', () => {
    expect(extractSnippet('', 'query')).toBe('')
  })

  it('空关键词匹配到位置 0', () => {
    const result = extractSnippet('Hello', '')
    expect(result).toContain('Hello')
  })

  it('关键词在开头时不添加前缀省略号', () => {
    const result = extractSnippet('hello world', 'hello')
    expect(result).not.toMatch(/^…/)
  })

  it('关键词在中间时添加前缀省略号', () => {
    const content = 'a'.repeat(100) + 'keyword' + 'b'.repeat(100)
    const result = extractSnippet(content, 'keyword')
    expect(result).toMatch(/^…/)
  })

  it('关键词在末尾时不添加后缀省略号', () => {
    const content = 'short text keyword'
    const result = extractSnippet(content, 'keyword')
    expect(result).not.toMatch(/…$/)
  })

  it('关键词不在末尾时添加后缀省略号', () => {
    const content = 'a'.repeat(50) + 'keyword' + 'b'.repeat(100)
    const result = extractSnippet(content, 'keyword')
    expect(result).toMatch(/…$/)
  })

  it('短文本无省略号', () => {
    const result = extractSnippet('hello world', 'hello')
    expect(result).toBe('hello world')
  })

  it('尊重自定义 contextBefore 和 contextAfter 参数', () => {
    const content = 'a'.repeat(100) + 'KEY' + 'b'.repeat(100)
    const result = extractSnippet(content, 'KEY', 10, 10)
    // 前缀省略号 + 10 字符 + KEY + 10 字符 + 后缀省略号
    expect(result).toBe('…' + 'a'.repeat(10) + 'KEY' + 'b'.repeat(10) + '…')
  })

  it('contextBefore 超出文本开头时截断到 0', () => {
    const content = 'abKEYcd'
    const result = extractSnippet(content, 'KEY', 100, 100)
    expect(result).toBe('abKEYcd')
  })

  it('contextAfter 超出文本末尾时截断到 content.length', () => {
    const content = 'abcKEY'
    const result = extractSnippet(content, 'KEY', 100, 100)
    expect(result).toBe('abcKEY')
  })

  it('多次出现时匹配第一个', () => {
    const content = 'first keyword and second keyword'
    const result = extractSnippet(content, 'keyword')
    expect(result).toContain('first keyword')
  })
})
