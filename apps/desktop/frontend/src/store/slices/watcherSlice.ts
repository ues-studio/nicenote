import type { StateCreator } from 'zustand'

import { debounce } from '@nicenote/shared'

import type { DesktopStore } from '../useDesktopStore'

// 防抖的笔记列表刷新（100ms），仅合并同一批次的后端事件
// 注：后端已有 300ms 防抖，此处仅需短暂合并即可
const debouncedLoadNotes = debounce((loadNotes: () => Promise<void>) => {
  void loadNotes()
}, 100)

export interface WatcherSlice {
  handleFileCreated: (path: string) => void
  handleFileModified: (path: string) => void
  handleFileDeleted: (path: string) => void
}

export const createWatcherSlice: StateCreator<DesktopStore, [], [], WatcherSlice> = (set, get) => ({
  handleFileCreated: (path: string) => {
    const { currentFolder } = get()
    if (!currentFolder) return
    if (path.startsWith(currentFolder)) {
      debouncedLoadNotes(get().loadNotes)
    }
  },

  handleFileModified: (path: string) => {
    const { activeNote, saveState, currentFolder } = get()
    // 当前正在编辑且有未保存内容时，跳过外部变更的重载以避免丢失用户编辑
    if (activeNote?.path === path && saveState === 'saved') {
      void get().openNote(path)
    }
    if (currentFolder && path.startsWith(currentFolder)) {
      debouncedLoadNotes(get().loadNotes)
    }
  },

  handleFileDeleted: (path: string) => {
    set((state) => {
      const notes = state.notes.filter((n) => n.path !== path)
      const activeNote = state.activeNote?.path === path ? null : state.activeNote
      return { notes, activeNote }
    })
  },
})
