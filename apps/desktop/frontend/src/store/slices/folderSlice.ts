import type { StateCreator } from 'zustand'

import { setCurrentFolder } from '../../adapters/repository-provider'
import { AppService } from '../../bindings/tauri'
import type { DesktopStore } from '../useDesktopStore'

export interface FolderSlice {
  currentFolder: string | null
  recentFolders: string[]
  openFolder: (path?: string) => Promise<void>
  loadRecentFolders: () => Promise<void>
}

export const createFolderSlice: StateCreator<DesktopStore, [], [], FolderSlice> = (set, get) => ({
  currentFolder: null,
  recentFolders: [],

  openFolder: async (path?: string) => {
    try {
      let folderPath = path
      if (!folderPath) {
        folderPath = await AppService.openFolderDialog()
      }
      if (!folderPath) return

      // 先更新状态，确保界面立即切换；同时创建 domain repository 实例
      set({ currentFolder: folderPath, activeNote: null, notes: [] })
      setCurrentFolder(folderPath)

      // 非关键操作并行执行，失败不影响主流程
      await Promise.allSettled([
        AppService.addRecentFolder(folderPath),
        AppService.watchFolder(folderPath),
      ])

      await get().loadNotes()
      await get().loadRecentFolders()
    } catch (err) {
      console.error('打开文件夹失败:', err)
    }
  },

  loadRecentFolders: async () => {
    try {
      const recentFolders = await AppService.getRecentFolders()
      set({ recentFolders })
    } catch {
      // Tauri 运行时未就绪时忽略错误
    }
  },
})
