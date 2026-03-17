import { create } from 'zustand'

import type { FolderSlice } from './slices/folderSlice'
import { createFolderSlice } from './slices/folderSlice'
import type { NoteSlice } from './slices/noteSlice'
import { createNoteSlice } from './slices/noteSlice'
import type { SearchSlice } from './slices/searchSlice'
import { createSearchSlice } from './slices/searchSlice'
import type { SettingsSlice } from './slices/settingsSlice'
import { createSettingsSlice } from './slices/settingsSlice'
import type { WatcherSlice } from './slices/watcherSlice'
import { createWatcherSlice } from './slices/watcherSlice'

// ============================================================
// 合并类型
// ============================================================

export type DesktopStore = FolderSlice & NoteSlice & SearchSlice & SettingsSlice & WatcherSlice

// ============================================================
// Store 创建
// ============================================================

export const useDesktopStore = create<DesktopStore>((...a) => ({
  ...createFolderSlice(...a),
  ...createNoteSlice(...a),
  ...createSearchSlice(...a),
  ...createSettingsSlice(...a),
  ...createWatcherSlice(...a),
}))

// ============================================================
// Re-exports
// ============================================================

export type { CurrentView } from './slices/settingsSlice'
