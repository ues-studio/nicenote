import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { FolderTree, Star } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import type {
  AppNoteDetail,
  AppNoteItem,
  AppShellContextValue,
  AppTagInfo,
  NavItemConfig,
} from '@nicenote/app-shell'
import { AppShellContext, ICON_SM_CLASS, mapToAppSearchResults } from '@nicenote/app-shell'
import type { Language, Theme } from '@nicenote/domain'

import { getCurrentRepo } from '../adapters/repository-provider'
import type { NoteContent, NoteFile } from '../bindings/tauri'
import { useDesktopStore } from '../store/useDesktopStore'
import { useSidebarStore } from '../store/useSidebarStore'
import { useToastStore } from '../store/useToastStore'

// ============================================================
// 数据模型转换
// ============================================================

function noteFileToAppItem(note: NoteFile): AppNoteItem {
  return {
    id: note.path,
    title: note.title,
    summary: note.summary || null,
    tags: note.tags,
    updatedAt: note.updatedAt,
    createdAt: note.createdAt,
  }
}

function noteContentToAppDetail(note: NoteContent): AppNoteDetail {
  return {
    id: note.path,
    title: note.title,
    summary: note.summary || null,
    tags: note.tags,
    updatedAt: note.updatedAt,
    createdAt: note.createdAt,
    content: note.content,
  }
}

// ============================================================
// 收藏按钮组件
// ============================================================

const FavoriteButton = memo(function FavoriteButton({ path }: { path: string }) {
  const isFavorite = useDesktopStore((s) => s.favorites.includes(path))
  const toggleFavorite = useDesktopStore((s) => s.toggleFavorite)

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        toggleFavorite(path)
      }}
      aria-label={isFavorite ? '取消收藏' : '收藏'}
      className="rounded p-1 text-muted-foreground/60 transition-colors hover:text-yellow-500"
    >
      <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
    </button>
  )
})

// ============================================================
// Provider
// ============================================================

export function DesktopAppShellProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()

  const store = useDesktopStore(
    useShallow((s) => ({
      notes: s.notes,
      activeNote: s.activeNote,
      isLoading: s.isLoading,
      saveState: s.saveState,
      currentView: s.currentView,
      selectedTag: s.selectedTag,
      favorites: s.favorites,
      tagColors: s.tagColors,
      settings: s.settings,
      // actions
      openNote: s.openNote,
      saveNote: s.saveNote,
      renameNote: s.renameNote,
      createNote: s.createNote,
      deleteNote: s.deleteNote,
      setSelectedTag: s.setSelectedTag,
      setCurrentView: s.setCurrentView,
      saveSettings: s.saveSettings,
      toggleFavorite: s.toggleFavorite,
    }))
  )

  // 独立 stores
  const sidebar = useSidebarStore()
  const { toasts, addToast, removeToast } = useToastStore()

  // 转换笔记列表
  const appNotes = useMemo(() => store.notes.map(noteFileToAppItem), [store.notes])

  // 当前笔记
  const currentNote = useMemo(
    () => (store.activeNote ? noteContentToAppDetail(store.activeNote) : null),
    [store.activeNote]
  )

  // 选中的笔记 ID
  const selectedNoteId = store.activeNote?.path ?? null

  // 标签信息
  const appTags: AppTagInfo[] = useMemo(() => {
    const tagCountMap = new Map<string, number>()
    for (const note of store.notes) {
      for (const tag of note.tags) {
        tagCountMap.set(tag, (tagCountMap.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(tagCountMap.entries())
      .map(([name, count]) => ({
        name,
        color: store.tagColors[name],
        count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [store.notes, store.tagColors])

  // 选中笔记
  const selectNote = useCallback(
    (id: string | null) => {
      if (id) {
        store.openNote(id)
      }
    },
    [store.openNote]
  )

  // 更新笔记
  const updateNote = useCallback(
    (_id: string, patch: { title?: string; content?: string; tags?: string[] }) => {
      if (patch.title !== undefined) {
        store.renameNote(patch.title)
      }
      if (patch.content !== undefined || patch.tags !== undefined) {
        const activeNote = useDesktopStore.getState().activeNote
        if (!activeNote) return
        const content = patch.content ?? activeNote.content
        const tags = patch.tags ?? activeNote.tags
        store.saveNote(content, tags)
      }
    },
    [store.renameNote, store.saveNote]
  )

  // 创建笔记
  const handleCreateNote = useCallback(() => store.createNote(), [store.createNote])

  // 删除笔记
  const handleDeleteNote = useCallback(
    (id: string) => {
      if (window.confirm(t('noteList.confirmDelete'))) {
        return store.deleteNote(id)
      }
    },
    [store.deleteNote, t]
  )

  // 搜索
  const searchNotes = useCallback(async (query: string) => {
    const repo = getCurrentRepo()
    if (!query.trim() || !repo) return []
    try {
      const results = await repo.search({ q: query, limit: 20 })
      return mapToAppSearchResults(results)
    } catch (err) {
      console.error('搜索笔记失败:', err)
      return []
    }
  }, [])

  // 主题和语言
  const setTheme = useCallback(
    (theme: Theme) => {
      store.saveSettings({ theme })
    },
    [store.saveSettings]
  )

  const setLanguage = useCallback(
    (lang: Language) => {
      store.saveSettings({ language: lang })
    },
    [store.saveSettings]
  )

  // 标签操作
  const noteTagActions = useMemo(
    () => ({
      addTag: (_noteId: string, tagName: string) => {
        const activeNote = useDesktopStore.getState().activeNote
        if (!activeNote) return
        if (!activeNote.tags.includes(tagName)) {
          store.saveNote(activeNote.content, [...activeNote.tags, tagName])
        }
      },
      removeTag: (_noteId: string, tagName: string) => {
        const activeNote = useDesktopStore.getState().activeNote
        if (!activeNote) return
        store.saveNote(
          activeNote.content,
          activeNote.tags.filter((t) => t !== tagName)
        )
      },
    }),
    [store.saveNote]
  )

  // 额外导航项（desktop 专有）
  const extraNavItems: NavItemConfig[] = useMemo(
    () => [
      {
        id: 'favorites',
        icon: <Star className={ICON_SM_CLASS} />,
        label: t('nav.favorites'),
        isActive: store.currentView === 'favorites',
        onClick: () => store.setCurrentView('favorites'),
      },
      {
        id: 'folder-tree',
        icon: <FolderTree className={ICON_SM_CLASS} />,
        label: t('nav.folderTree'),
        isActive: store.currentView === 'folder-tree',
        onClick: () => store.setCurrentView('folder-tree'),
      },
    ],
    [store.currentView, store.setCurrentView, t]
  )

  // 列表项扩展（收藏星标 + 右键菜单）
  const noteListItemSlots = useMemo(
    () => ({
      renderActions: (noteId: string) => <FavoriteButton path={noteId} />,
      onContextMenu: (_noteId: string, e: React.MouseEvent) => {
        e.preventDefault()
      },
    }),
    []
  )

  const value: AppShellContextValue = useMemo(
    () => ({
      notes: appNotes,
      selectedNoteId,
      isLoading: store.isLoading,
      currentNote,
      saveState: store.saveState,
      selectNote,
      createNote: handleCreateNote,
      deleteNote: handleDeleteNote,
      updateNote,
      sidebar,
      tags: appTags,
      selectedTag: store.selectedTag,
      setSelectedTag: store.setSelectedTag,
      noteTagActions,
      theme: store.settings.theme,
      setTheme,
      language: store.settings.language,
      setLanguage,
      toasts,
      addToast,
      removeToast,
      searchNotes,
      isMobile: false,
      extraNavItems,
      noteListItemSlots,
    }),
    [
      appNotes,
      selectedNoteId,
      store.isLoading,
      currentNote,
      store.saveState,
      selectNote,
      handleCreateNote,
      handleDeleteNote,
      updateNote,
      sidebar,
      appTags,
      store.selectedTag,
      store.setSelectedTag,
      noteTagActions,
      store.settings.theme,
      setTheme,
      store.settings.language,
      setLanguage,
      toasts,
      addToast,
      removeToast,
      searchNotes,
      extraNavItems,
      noteListItemSlots,
    ]
  )

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
}
