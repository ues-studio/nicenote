import { create } from 'zustand'

import { debounce } from '@nicenote/shared'

import type { NoteContent, NoteFile, SearchResult, Settings } from '../bindings/nicenote_desktop'
import { AppService } from '../bindings/nicenote_desktop'

// ============================================================
// 常量
// ============================================================

const THEME_STORAGE_KEY = 'nicenote-desktop-theme'
const LANG_STORAGE_KEY = 'nicenote-desktop-lang'

// ============================================================
// 状态类型定义
// ============================================================

export type CurrentView = 'all' | 'tags' | 'favorites' | 'folder-tree'

export interface DesktopState {
  // 文件夹状态
  currentFolder: string | null
  recentFolders: string[]

  // 笔记列表
  notes: NoteFile[]
  activeNote: NoteContent | null
  isLoading: boolean

  // 搜索状态
  searchOpen: boolean
  searchQuery: string
  searchResults: SearchResult[]
  isSearching: boolean

  // 视图状态
  currentView: CurrentView
  selectedTag: string | null

  // 应用设置
  settings: Settings
  tagColors: Record<string, string>
  favorites: string[]

  // 侧边栏状态
  sidebarOpen: boolean

  // 保存状态指示器
  saveState: 'saved' | 'saving' | 'unsaved'
}

// ============================================================
// Action 类型定义
// ============================================================

export interface DesktopActions {
  // 文件夹操作
  openFolder: (path?: string) => Promise<void>
  loadNotes: () => Promise<void>

  // 笔记操作
  openNote: (path: string) => Promise<void>
  saveNote: (content: string, tags: string[]) => void
  createNote: () => Promise<void>
  renameNote: (newTitle: string) => void
  deleteNote: (path: string) => Promise<void>

  // 搜索操作
  setSearchOpen: (open: boolean) => void
  search: (query: string) => Promise<void>

  // 视图操作
  setCurrentView: (view: CurrentView) => void
  setSelectedTag: (tag: string | null) => void
  toggleSidebar: () => void

  // 收藏操作
  toggleFavorite: (path: string) => Promise<void>
  loadFavorites: () => Promise<void>

  // 设置操作
  loadSettings: () => Promise<void>
  saveSettings: (settings: Partial<Settings>) => Promise<void>
  loadTagColors: () => Promise<void>
  setTagColor: (tag: string, color: string) => Promise<void>

  // 文件监听回调（由 useWailsEvents 调用）
  handleFileCreated: (path: string) => void
  handleFileModified: (path: string) => void
  handleFileDeleted: (path: string) => void
}

export type DesktopStore = DesktopState & DesktopActions

// ============================================================
// 防抖的保存函数（800ms）
// ============================================================

// 用于延迟执行实际的 IPC 保存调用
const debouncedSaveIpc = debounce(
  async (path: string, content: string, tags: string[], onDone: () => void) => {
    try {
      await AppService.SaveNote(path, content, tags)
      onDone()
    } catch (err) {
      console.error('保存笔记失败:', err)
    }
  },
  800
)

// 防抖的重命名函数（1500ms）
const debouncedRenameIpc = debounce(
  async (oldPath: string, newTitle: string, onSuccess: (updatedNote: NoteFile) => void) => {
    try {
      const updated = await AppService.RenameNote(oldPath, newTitle)
      if (!updated) return
      onSuccess(updated)
    } catch (err) {
      console.error('重命名笔记失败:', err)
    }
  },
  1500
)

// ============================================================
// Zustand Store
// ============================================================

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  // ---- 初始状态 ----

  currentFolder: null,
  recentFolders: [],
  notes: [],
  activeNote: null,
  isLoading: false,
  searchOpen: false,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  currentView: 'all',
  selectedTag: null,
  settings: {
    theme: 'system',
    language: 'zh',
  },
  tagColors: {},
  favorites: [],
  sidebarOpen: true,
  saveState: 'saved',

  // ---- 文件夹操作 ----

  openFolder: async (path?: string) => {
    try {
      let folderPath = path
      if (!folderPath) {
        // 打开系统文件夹选择对话框
        folderPath = await AppService.OpenFolderDialog()
      }
      if (!folderPath) return

      // 记录到最近文件夹
      await AppService.AddRecentFolder(folderPath)

      // 启动文件系统监听
      await AppService.WatchFolder(folderPath)

      set({ currentFolder: folderPath, activeNote: null, notes: [] })

      // 并行加载笔记列表和最近文件夹
      await get().loadNotes()
      const recent = await AppService.GetRecentFolders()
      set({ recentFolders: recent })
    } catch (err) {
      console.error('打开文件夹失败:', err)
    }
  },

  loadNotes: async () => {
    const { currentFolder } = get()
    if (!currentFolder) return

    set({ isLoading: true })
    try {
      const notes = await AppService.ListNotes(currentFolder)
      // 按更新时间降序排列
      notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      set({ notes })
    } catch (err) {
      console.error('加载笔记列表失败:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  // ---- 笔记操作 ----

  openNote: async (path: string) => {
    try {
      const content = await AppService.GetNoteContent(path)
      set({ activeNote: content })
    } catch (err) {
      console.error('打开笔记失败:', err)
    }
  },

  saveNote: (content: string, tags: string[]) => {
    const { activeNote } = get()
    if (!activeNote) return

    // 立即更新本地状态，显示"保存中"
    set({
      saveState: 'saving',
      activeNote: { ...activeNote, content },
    })

    debouncedSaveIpc(activeNote.path, content, tags, () => {
      set({ saveState: 'saved' })
      // 更新笔记列表中的摘要
      get().loadNotes()
    })
  },

  createNote: async () => {
    const { currentFolder } = get()
    if (!currentFolder) return

    try {
      const newNote = await AppService.CreateNote(currentFolder)
      if (!newNote) return
      // 将新笔记加到列表头部
      set((state) => ({ notes: [newNote, ...state.notes] }))
      // 立即打开新笔记
      await get().openNote(newNote.path)
    } catch (err) {
      console.error('创建笔记失败:', err)
    }
  },

  renameNote: (newTitle: string) => {
    const { activeNote } = get()
    if (!activeNote) return

    // 立即更新本地标题，提供即时反馈
    set({ activeNote: { ...activeNote, title: newTitle } })

    debouncedRenameIpc(activeNote.path, newTitle, (updated) => {
      // 用服务器返回的数据（含新 path）更新 activeNote
      set((state) => {
        const updatedActiveNote = state.activeNote ? { ...state.activeNote, ...updated } : null
        const notes = state.notes.map((n) =>
          n.path === activeNote.path ? { ...n, ...updated } : n
        )
        return { activeNote: updatedActiveNote, notes }
      })
    })
  },

  deleteNote: async (path: string) => {
    try {
      await AppService.DeleteNote(path)
      set((state) => {
        const notes = state.notes.filter((n) => n.path !== path)
        const activeNote = state.activeNote?.path === path ? null : state.activeNote
        return { notes, activeNote }
      })
    } catch (err) {
      console.error('删除笔记失败:', err)
    }
  },

  // ---- 搜索操作 ----

  setSearchOpen: (open: boolean) => {
    set({ searchOpen: open })
    if (!open) {
      set({ searchQuery: '', searchResults: [] })
    }
  },

  search: async (query: string) => {
    const { currentFolder } = get()
    set({ searchQuery: query })
    if (!query.trim() || !currentFolder) {
      set({ searchResults: [] })
      return
    }

    set({ isSearching: true })
    try {
      const results = await AppService.SearchNotes(currentFolder, query)
      set({ searchResults: results })
    } catch (err) {
      console.error('搜索失败:', err)
      set({ searchResults: [] })
    } finally {
      set({ isSearching: false })
    }
  },

  // ---- 视图操作 ----

  setCurrentView: (view: CurrentView) => {
    set({ currentView: view, selectedTag: null })
  },

  setSelectedTag: (tag: string | null) => {
    set({ selectedTag: tag, currentView: 'all' })
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },

  // ---- 收藏操作 ----

  toggleFavorite: async (path: string) => {
    try {
      await AppService.ToggleFavorite(path)
      await get().loadFavorites()
    } catch (err) {
      console.error('切换收藏失败:', err)
    }
  },

  loadFavorites: async () => {
    try {
      const favorites = await AppService.GetFavorites()
      set({ favorites })
    } catch (err) {
      console.error('加载收藏失败:', err)
    }
  },

  // ---- 设置操作 ----

  loadSettings: async () => {
    try {
      const settings = await AppService.GetSettings()
      if (!settings) return
      set({ settings })
      // 应用主题到 DOM
      applyTheme(settings.theme)
      // 持久化到 localStorage，供下次冷启动使用
      localStorage.setItem(THEME_STORAGE_KEY, settings.theme)
      localStorage.setItem(LANG_STORAGE_KEY, settings.language)
    } catch (err) {
      console.error('加载设置失败:', err)
    }
  },

  saveSettings: async (patch: Partial<Settings>) => {
    const current = get().settings
    const updated: Settings = { ...current, ...patch }
    set({ settings: updated })
    // 应用主题
    if (patch.theme) {
      applyTheme(patch.theme)
      localStorage.setItem(THEME_STORAGE_KEY, patch.theme)
    }
    if (patch.language) {
      localStorage.setItem(LANG_STORAGE_KEY, patch.language)
      document.documentElement.lang = patch.language
    }
    try {
      await AppService.SaveSettings(updated)
    } catch (err) {
      console.error('保存设置失败:', err)
    }
  },

  loadTagColors: async () => {
    try {
      const tagColors = await AppService.GetTagColors()
      set({ tagColors })
    } catch (err) {
      console.error('加载标签颜色失败:', err)
    }
  },

  setTagColor: async (tag: string, color: string) => {
    // 乐观更新本地状态
    set((state) => ({ tagColors: { ...state.tagColors, [tag]: color } }))
    try {
      await AppService.SetTagColor(tag, color)
    } catch (err) {
      console.error('设置标签颜色失败:', err)
    }
  },

  // ---- 文件监听回调 ----

  handleFileCreated: (path: string) => {
    // 文件创建事件：重新加载笔记列表
    const { currentFolder } = get()
    if (!currentFolder) return
    // 检查是否在当前文件夹下
    if (path.startsWith(currentFolder)) {
      get().loadNotes()
    }
  },

  handleFileModified: (path: string) => {
    const { activeNote } = get()
    // 如果修改的是当前打开的笔记，重新加载内容（可能由外部编辑器修改）
    if (activeNote?.path === path) {
      get().openNote(path)
    }
    // 更新列表（摘要可能变化）
    get().loadNotes()
  },

  handleFileDeleted: (path: string) => {
    set((state) => {
      const notes = state.notes.filter((n) => n.path !== path)
      const activeNote = state.activeNote?.path === path ? null : state.activeNote
      return { notes, activeNote }
    })
  },
}))

// ============================================================
// 工具函数：应用主题到 DOM
// ============================================================

function applyTheme(theme: Settings['theme']) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.classList.toggle('dark', theme === 'dark')
    root.setAttribute('data-theme', theme)
  }
}

// ============================================================
// Selectors
// ============================================================

/** 过滤当前视图下的笔记列表 */
export function selectFilteredNotes(state: DesktopState): NoteFile[] {
  let notes = state.notes

  if (state.currentView === 'favorites') {
    notes = notes.filter((n) => state.favorites.includes(n.path))
  }

  if (state.selectedTag) {
    notes = notes.filter((n) => n.tags.includes(state.selectedTag!))
  }

  return notes
}

/** 提取所有唯一标签 */
export function selectAllTags(state: DesktopState): string[] {
  const tagSet = new Set<string>()
  for (const note of state.notes) {
    for (const tag of note.tags) {
      tagSet.add(tag)
    }
  }
  return Array.from(tagSet).sort()
}
