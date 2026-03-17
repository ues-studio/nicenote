import React, { useCallback, useMemo } from 'react'

import { useShallow } from 'zustand/react/shallow'

import type {
  AppNoteDetail,
  AppNoteItem,
  AppShellContextValue,
  AppTagInfo,
} from '@nicenote/app-shell'
import { AppShellContext, mapToAppSearchResults } from '@nicenote/app-shell'
import { generateSummary } from '@nicenote/shared'

import { getRepository } from '../adapters/repository-provider'
import { useNoteStore } from '../store/useNoteStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useSidebarStore } from '../store/useSidebarStore'
import { useTagStore } from '../store/useTagStore'
import { useToastStore } from '../store/useToastStore'

// ============================================================
// 数据模型转换
// ============================================================

function noteToAppItem(note: {
  id: string
  title: string
  summary: string | null
  createdAt: string
  updatedAt: string
}): AppNoteItem {
  return {
    id: note.id,
    title: note.title,
    summary: note.summary,
    tags: [],
    updatedAt: note.updatedAt,
    createdAt: note.createdAt,
  }
}

// ============================================================
// Provider
// ============================================================

export function MobileAppShellProvider({ children }: { children: React.ReactNode }) {
  const {
    notes,
    noteIds,
    activeNote,
    selectedNoteId,
    isLoading,
    isSaving,
    selectNote,
    createNote: storeCreateNote,
    deleteNote: storeDeleteNote,
    updateNoteContent,
    updateNoteTitle,
  } = useNoteStore(
    useShallow((s) => ({
      notes: s.notes,
      noteIds: s.noteIds,
      activeNote: s.activeNote,
      selectedNoteId: s.selectedNoteId,
      isLoading: s.isLoading,
      isSaving: s.isSaving,
      selectNote: s.selectNote,
      createNote: s.createNote,
      deleteNote: s.deleteNote,
      updateNoteContent: s.updateNoteContent,
      updateNoteTitle: s.updateNoteTitle,
    }))
  )

  const { tags, tagIds } = useTagStore(
    useShallow((s) => ({
      tags: s.tags,
      tagIds: s.tagIds,
    }))
  )

  const { theme, setTheme, language, setLanguage } = useSettingsStore()
  const sidebarStore = useSidebarStore()
  const toastStore = useToastStore()

  // 笔记列表
  const appNotes: AppNoteItem[] = useMemo(
    () => noteIds.map((id) => noteToAppItem(notes[id]!)),
    [noteIds, notes]
  )

  // 当前笔记详情
  const currentNote: AppNoteDetail | null = useMemo(() => {
    if (!activeNote) return null
    return {
      id: activeNote.id,
      title: activeNote.title,
      summary: activeNote.summary ?? generateSummary(activeNote.content ?? '') ?? null,
      tags: [],
      updatedAt: activeNote.updatedAt,
      createdAt: activeNote.createdAt,
      content: activeNote.content,
    }
  }, [activeNote])

  // 保存状态
  const saveState = isSaving ? 'saving' : 'saved'

  // 标签列表
  const appTags: AppTagInfo[] = useMemo(
    () => tagIds.map((id) => ({ name: tags[id]!.name, color: tags[id]!.color, count: 0 })),
    [tagIds, tags]
  )

  // 操作回调
  const handleCreateNote = useCallback(() => {
    storeCreateNote()
  }, [storeCreateNote])

  const handleDeleteNote = useCallback(
    (id: string) => {
      storeDeleteNote(id)
    },
    [storeDeleteNote]
  )

  const handleUpdateNote = useCallback(
    (id: string, patch: { title?: string; content?: string; tags?: string[] }) => {
      if (patch.title !== undefined) updateNoteTitle(id, patch.title)
      if (patch.content !== undefined) updateNoteContent(id, patch.content)
    },
    [updateNoteTitle, updateNoteContent]
  )

  // 搜索
  const searchNotes = useCallback(async (query: string) => {
    try {
      const results = await getRepository().search({ q: query, limit: 20 })
      return mapToAppSearchResults(results)
    } catch {
      return []
    }
  }, [])

  // 侧边栏（直接使用 app-shell 工厂创建的 store）
  const sidebar = useMemo(
    () => ({
      isOpen: sidebarStore.isOpen,
      toggle: sidebarStore.toggle,
      open: sidebarStore.open,
      close: sidebarStore.close,
    }),
    [sidebarStore.isOpen, sidebarStore.toggle, sidebarStore.open, sidebarStore.close]
  )

  const value: AppShellContextValue = useMemo(
    () => ({
      notes: appNotes,
      selectedNoteId,
      isLoading,
      currentNote,
      saveState,
      selectNote,
      createNote: handleCreateNote,
      deleteNote: handleDeleteNote,
      updateNote: handleUpdateNote,
      sidebar,
      tags: appTags,
      selectedTag: null,
      setSelectedTag: () => {},
      noteTagActions: {
        addTag: () => {},
        removeTag: () => {},
      },
      theme,
      setTheme,
      language,
      setLanguage,
      toasts: toastStore.toasts,
      addToast: toastStore.addToast,
      removeToast: toastStore.removeToast,
      searchNotes,
      isMobile: true,
    }),
    [
      appNotes,
      selectedNoteId,
      isLoading,
      currentNote,
      saveState,
      selectNote,
      handleCreateNote,
      handleDeleteNote,
      handleUpdateNote,
      sidebar,
      appTags,
      theme,
      setTheme,
      language,
      setLanguage,
      toastStore.toasts,
      toastStore.addToast,
      toastStore.removeToast,
      searchNotes,
    ]
  )

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
}
