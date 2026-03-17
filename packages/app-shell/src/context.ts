import { createContext, useContext } from 'react'

import type { Language, Theme } from '@nicenote/domain'

import type {
  AppNoteDetail,
  AppNoteItem,
  AppSearchResult,
  AppTagInfo,
  NavItemConfig,
  NoteListItemSlots,
  NoteTagActions,
  SidebarState,
  Toast,
  ToastOptions,
} from './types'

// ============================================================
// AppShell Context — 两端共享的统一接口
// ============================================================

export interface AppShellContextValue {
  // ---- 笔记列表 ----
  notes: AppNoteItem[]
  selectedNoteId: string | null
  isLoading: boolean

  // ---- 当前笔记 ----
  currentNote: AppNoteDetail | null
  saveState?: 'saved' | 'saving' | 'unsaved'

  // ---- 笔记操作 ----
  selectNote: (id: string | null) => void
  createNote: () => void | Promise<void>
  deleteNote: (id: string) => void
  updateNote: (id: string, patch: { title?: string; content?: string; tags?: string[] }) => void

  // ---- 侧边栏 ----
  sidebar: SidebarState

  // ---- 标签 ----
  tags: AppTagInfo[]
  selectedTag: string | null
  setSelectedTag: (tag: string | null) => void
  noteTagActions: NoteTagActions

  // ---- 主题 ----
  theme: Theme
  setTheme: (theme: Theme) => void

  // ---- 语言 ----
  language: Language
  setLanguage: (lang: Language) => void

  // ---- Toast ----
  toasts: Toast[]
  addToast: (message: string, options?: ToastOptions) => string
  removeToast: (id: string) => void

  // ---- 搜索 ----
  searchNotes: (query: string) => Promise<AppSearchResult[]>

  // ---- 平台扩展 ----
  isMobile: boolean
  extraNavItems?: NavItemConfig[]
  noteListItemSlots?: NoteListItemSlots
}

export const AppShellContext = createContext<AppShellContextValue | null>(null)

/** 获取 AppShell Context，必须在 AppShellProvider 内使用 */
export function useAppShell(): AppShellContextValue {
  const ctx = useContext(AppShellContext)
  if (!ctx) {
    throw new Error('useAppShell 必须在 AppShellProvider 内使用')
  }
  return ctx
}
