const DEFAULT_CONTEXT_BEFORE = 40
const DEFAULT_CONTEXT_AFTER = 60

/**
 * 从文本内容中提取包含关键词的上下文片段
 *
 * @param content - 原始文本内容
 * @param query - 搜索关键词
 * @param contextBefore - 关键词前保留的字符数（默认 40）
 * @param contextAfter - 关键词后保留的字符数（默认 60）
 * @returns 包含省略号的上下文片段，未找到关键词时返回空字符串
 */
export function extractSnippet(
  content: string,
  query: string,
  contextBefore = DEFAULT_CONTEXT_BEFORE,
  contextAfter = DEFAULT_CONTEXT_AFTER
): string {
  const contentIdx = content.toLowerCase().indexOf(query.toLowerCase())
  if (contentIdx === -1) return ''

  const start = Math.max(0, contentIdx - contextBefore)
  const end = Math.min(content.length, contentIdx + query.length + contextAfter)
  const raw = content.slice(start, end)
  return (start > 0 ? '…' : '') + raw + (end < content.length ? '…' : '')
}
