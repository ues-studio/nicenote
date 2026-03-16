import type { StateCreator } from 'zustand'

import { AppService } from '../../bindings/tauri'
import { setCurrentFolder } from '../../lib/repository-provider'
import type { DesktopStore } from '../useDesktopStore'

export interface FolderSlice {
  currentFolder: string | null
  recentFolders: string[]
  openFolder: (path?: string) => Promise<void>
}

export const createFolderSlice: StateCreator<DesktopStore, [], [], FolderSlice> = (set, get) => ({
  currentFolder: null,
  recentFolders: [],

  openFolder: async (path?: string) => {
    try {
      let folderPath = path
      if (!folderPath) {
        folderPath = await AppService.OpenFolderDialog()
      }
      if (!folderPath) return

      // 先更新状态，确保界面立即切换；同时创建 domain repository 实例
      set({ currentFolder: folderPath, activeNote: null, notes: [] })
      setCurrentFolder(folderPath)

      // 非关键操作并行执行，失败不影响主流程
      await Promise.allSettled([
        AppService.AddRecentFolder(folderPath),
        AppService.WatchFolder(folderPath),
      ])

      await get().loadNotes()
      const recent = await AppService.GetRecentFolders()
      set({ recentFolders: recent })
    } catch (err) {
      console.error('打开文件夹失败:', err)
    }
  },
})
