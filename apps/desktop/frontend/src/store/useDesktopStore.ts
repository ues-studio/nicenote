import { create } from 'zustand'

import type { NoteFile } from '../bindings/tauri'

import type { FolderSlice } from './slices/folderSlice'
import { createFolderSlice } from './slices/folderSlice'
import type { NoteSlice } from './slices/noteSlice'
import { createNoteSlice } from './slices/noteSlice'
import type { SearchSlice } from './slices/searchSlice'
import { createSearchSlice } from './slices/searchSlice'
import type { SettingsSlice } from './slices/settingsSlice'
import { createSettingsSlice } from './slices/settingsSlice'
import type { SidebarSlice } from './slices/sidebarSlice'
import { createSidebarSlice } from './slices/sidebarSlice'
import type { ToastSlice } from './slices/toastSlice'
import { createToastSlice } from './slices/toastSlice'
import type { WatcherSlice } from './slices/watcherSlice'
import { createWatcherSlice } from './slices/watcherSlice'

// ============================================================
// 合并类型
// ============================================================

export type DesktopStore = FolderSlice &
  NoteSlice &
  SearchSlice &
  SettingsSlice &
  SidebarSlice &
  ToastSlice &
  WatcherSlice

// ============================================================
// Store 创建
// ============================================================

export const useDesktopStore = create<DesktopStore>((...a) => ({
  ...createFolderSlice(...a),
  ...createNoteSlice(...a),
  ...createSearchSlice(...a),
  ...createSettingsSlice(...a),
  ...createSidebarSlice(...a),
  ...createToastSlice(...a),
  ...createWatcherSlice(...a),
}))

// ============================================================
// Selectors
// ============================================================

/** 过滤当前视图下的笔记列表 */
export function selectFilteredNotes(state: DesktopStore): NoteFile[] {
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
export function selectAllTags(state: DesktopStore): string[] {
  const tagSet = new Set<string>()
  for (const note of state.notes) {
    for (const tag of note.tags) {
      tagSet.add(tag)
    }
  }
  return Array.from(tagSet).sort()
}

// ============================================================
// Re-exports
// ============================================================

export type { CurrentView } from './slices/settingsSlice'
