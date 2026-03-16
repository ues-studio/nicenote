import { useCallback, useMemo } from 'react'

import { useShallow } from 'zustand/react/shallow'

import type {
  AppNoteDetail,
  AppNoteItem,
  AppSearchResult,
  AppShellContextValue,
  AppTagInfo,
} from '@nicenote/app-shell'
import { AppShellContext } from '@nicenote/app-shell'
import type { NoteSelect } from '@nicenote/shared'
import { generateSummary } from '@nicenote/shared'
import { useIsBreakpoint } from '@nicenote/ui'

import { useLanguageStore } from '../store/useLanguageStore'
import { useNoteStore } from '../store/useNoteStore'
import { useSidebarStore } from '../store/useSidebarStore'
import { useThemeStore } from '../store/useThemeStore'
import { useToastStore } from '../store/useToastStore'

// ============================================================
// 数据模型转换
// ============================================================

function noteToAppItem(
  note: NoteSelect,
  noteTags: Record<string, string[]>,
  tagMap: Map<string, string>
): AppNoteItem {
  const tagIds = noteTags[note.id] ?? []
  const tagNames = tagIds.map((id) => tagMap.get(id)).filter(Boolean) as string[]
  return {
    id: note.id,
    title: note.title,
    summary: generateSummary(note.content ?? '') || null,
    tags: tagNames,
    updatedAt: note.updatedAt,
    createdAt: note.createdAt,
  }
}

function noteToAppDetail(
  note: NoteSelect,
  noteTags: Record<string, string[]>,
  tagMap: Map<string, string>
): AppNoteDetail {
  return {
    ...noteToAppItem(note, noteTags, tagMap),
    content: note.content,
  }
}

// ============================================================
// Provider
// ============================================================

export function WebAppShellProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsBreakpoint('max', 768)

  // Note store
  const {
    notes,
    selectedNoteId,
    isLoading,
    tags: rawTags,
    noteTags,
    selectNote,
    createNote,
    deleteNote,
    updateNote,
    search,
    createTag,
    addTagToNote,
    removeTagFromNote,
  } = useNoteStore(
    useShallow((s) => ({
      notes: s.notes,
      selectedNoteId: s.selectedNoteId,
      isLoading: s.isLoading,
      tags: s.tags,
      noteTags: s.noteTags,
      selectNote: s.selectNote,
      createNote: s.createNote,
      deleteNote: s.deleteNote,
      updateNote: s.updateNote,
      search: s.search,
      createTag: s.createTag,
      addTagToNote: s.addTagToNote,
      removeTagFromNote: s.removeTagFromNote,
    }))
  )

  // Sidebar store
  const sidebar = useSidebarStore(
    useShallow((s) => ({
      isOpen: s.isOpen,
      width: s.width,
      isResizing: s.isResizing,
      open: s.open,
      close: s.close,
      toggle: s.toggle,
      setWidth: s.setWidth,
      startResize: s.startResize,
      stopResize: s.stopResize,
    }))
  )

  // Theme store
  const { theme, setTheme } = useThemeStore(
    useShallow((s) => ({
      theme: s.theme,
      setTheme: s.setTheme,
    }))
  )

  // Language store
  const { language, setLanguage } = useLanguageStore(
    useShallow((s) => ({
      language: s.language,
      setLanguage: s.setLanguage,
    }))
  )

  // Toast store
  const { toasts, addToast, removeToast } = useToastStore(
    useShallow((s) => ({
      toasts: s.toasts,
      addToast: s.addToast,
      removeToast: s.removeToast,
    }))
  )

  // 标签 ID→name 映射
  const tagMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const tag of rawTags) {
      map.set(tag.id, tag.name)
    }
    return map
  }, [rawTags])

  // 标签 name→ID 映射
  const tagNameToId = useMemo(() => {
    const map = new Map<string, string>()
    for (const tag of rawTags) {
      map.set(tag.name, tag.id)
    }
    return map
  }, [rawTags])

  // 转换笔记为 AppNoteItem[]
  const appNotes = useMemo(
    () => notes.map((n) => noteToAppItem(n, noteTags, tagMap)),
    [notes, noteTags, tagMap]
  )

  // 当前笔记
  const currentNote = useMemo(() => {
    if (!selectedNoteId) return null
    const note = notes.find((n) => n.id === selectedNoteId)
    if (!note) return null
    return noteToAppDetail(note, noteTags, tagMap)
  }, [notes, selectedNoteId, noteTags, tagMap])

  // 标签信息
  const appTags: AppTagInfo[] = useMemo(() => {
    // 计算每个标签被多少笔记引用
    const countMap = new Map<string, number>()
    for (const tagIds of Object.values(noteTags)) {
      for (const tagId of tagIds) {
        countMap.set(tagId, (countMap.get(tagId) ?? 0) + 1)
      }
    }
    return rawTags.map((tag) => ({
      name: tag.name,
      color: tag.color ?? (undefined as string | undefined),
      count: countMap.get(tag.id) ?? 0,
    }))
  }, [rawTags, noteTags])

  // 标签操作——需要把 tagName 映射回 tagId
  const noteTagActions = useMemo(
    () => ({
      addTag: (noteId: string, tagName: string) => {
        let tagId = tagNameToId.get(tagName)
        if (!tagId) {
          // 标签不存在，先创建
          const newTag = createTag(tagName)
          tagId = newTag.id
        }
        addTagToNote(noteId, tagId)
      },
      removeTag: (noteId: string, tagName: string) => {
        const tagId = tagNameToId.get(tagName)
        if (tagId) removeTagFromNote(noteId, tagId)
      },
    }),
    [tagNameToId, createTag, addTagToNote, removeTagFromNote]
  )

  // 搜索——web 的 search 是同步的，包装成 async
  const searchNotes = useCallback(
    async (query: string): Promise<AppSearchResult[]> => {
      const results = search(query)
      return results.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        tags: [],
        updatedAt: r.updatedAt,
        createdAt: r.createdAt,
        snippet: r.snippet,
      }))
    },
    [search]
  )

  const handleUpdateNote = useCallback(
    (id: string, patch: { title?: string; content?: string; tags?: string[] }) => {
      // Web 端暂不支持通过 updateNote 更新 tags
      const webPatch: { title?: string; content?: string | null } = {}
      if (patch.title !== undefined) webPatch.title = patch.title
      if (patch.content !== undefined) webPatch.content = patch.content
      updateNote(id, webPatch)
    },
    [updateNote]
  )

  const value: AppShellContextValue = useMemo(
    () => ({
      notes: appNotes,
      selectedNoteId,
      isLoading,
      currentNote,
      selectNote,
      createNote: async () => {
        await createNote()
      },
      deleteNote,
      updateNote: handleUpdateNote,
      sidebar,
      tags: appTags,
      selectedTag: null,
      setSelectedTag: () => {},
      noteTagActions,
      theme,
      setTheme,
      language,
      setLanguage: (lang: string) => setLanguage(lang as 'en' | 'zh'),
      toasts,
      addToast,
      removeToast,
      searchNotes,
      isMobile,
    }),
    [
      appNotes,
      selectedNoteId,
      isLoading,
      currentNote,
      selectNote,
      createNote,
      deleteNote,
      handleUpdateNote,
      sidebar,
      appTags,
      noteTagActions,
      theme,
      setTheme,
      language,
      setLanguage,
      toasts,
      addToast,
      removeToast,
      searchNotes,
      isMobile,
    ]
  )

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
}
