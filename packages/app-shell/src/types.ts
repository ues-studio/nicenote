import type { ReactNode } from 'react'

// ============================================================
// 统一数据模型（两端映射到此）
// ============================================================

/** 笔记列表项（统一格式） */
export interface AppNoteItem {
  /** 唯一标识：web 为 UUID，desktop 为文件路径 */
  id: string
  title: string
  summary: string | null
  /** 标签名数组 */
  tags: string[]
  updatedAt: string
  createdAt: string
}

/** 笔记详情（含内容） */
export interface AppNoteDetail extends AppNoteItem {
  content: string | null
}

/** 标签信息 */
export interface AppTagInfo {
  name: string
  color?: string | undefined
  count: number
}

/** 搜索结果 */
export interface AppSearchResult extends AppNoteItem {
  snippet: string
}

// ============================================================
// Toast
// ============================================================

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  message: string
  action?: ToastAction
}

export interface ToastOptions {
  action?: ToastAction
  duration?: number
}

// ============================================================
// 侧边栏
// ============================================================

export interface SidebarState {
  isOpen: boolean
  width: number
  isResizing: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setWidth: (width: number) => void
  startResize: () => void
  stopResize: () => void
}

// ============================================================
// 平台扩展
// ============================================================

/** 额外导航项配置（desktop 添加收藏、文件夹树等） */
export interface NavItemConfig {
  id: string
  icon: ReactNode
  label: string
  isActive?: boolean
  onClick: () => void
}

/** 笔记列表项扩展插槽 */
export interface NoteListItemSlots {
  /** 渲染额外操作按钮（如收藏星标） */
  renderActions?: (noteId: string) => ReactNode
  /** 右键菜单处理 */
  onContextMenu?: (noteId: string, e: React.MouseEvent) => void
}

// ============================================================
// 标签操作
// ============================================================

export interface NoteTagActions {
  addTag: (noteId: string, tagName: string) => void
  removeTag: (noteId: string, tagName: string) => void
}
