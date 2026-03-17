const MAX_SUMMARY_LENGTH = 200

// 预编译正则表达式，避免每次调用 generateSummary 时重复编译
const RE_CODE_BLOCK = /```[\s\S]*?```/g
const RE_HEADER = /^#{1,6}\s+/gm
const RE_BOLD = /\*\*(.+?)\*\*/g
const RE_ITALIC = /\*(.+?)\*/g
const RE_INLINE_CODE = /`(.+?)`/g
const RE_IMAGE = /!\[.*?\]\(.+?\)/g
const RE_LINK = /\[(.+?)\]\(.+?\)/g
const RE_BLOCKQUOTE = />\s+/g
const RE_LIST_MARKER = /[-*+]\s+/gm
const RE_NUMBERED_LIST = /\d+\.\s+/gm
const RE_BLANK_LINES = /\n{2,}/g

export function generateSummary(
  content: string | null | undefined,
  maxLength = MAX_SUMMARY_LENGTH
): string | null {
  if (!content) return null

  const plain = content
    .replace(RE_CODE_BLOCK, '')
    .replace(RE_HEADER, '')
    .replace(RE_BOLD, '$1')
    .replace(RE_ITALIC, '$1')
    .replace(RE_INLINE_CODE, '$1')
    .replace(RE_IMAGE, '') // 必须在 RE_LINK 之前
    .replace(RE_LINK, '$1')
    .replace(RE_BLOCKQUOTE, '')
    .replace(RE_LIST_MARKER, '')
    .replace(RE_NUMBERED_LIST, '')
    .replace(RE_BLANK_LINES, '\n')
    .trim()

  if (!plain) return null
  return plain.length > maxLength ? plain.slice(0, maxLength) : plain
}
