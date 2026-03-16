import { TauriNoteRepository } from './tauri-note-repository'

let currentRepo: TauriNoteRepository | null = null

/** 当用户打开文件夹时调用，创建新的 repository 实例 */
export function setCurrentFolder(folderPath: string): TauriNoteRepository {
  currentRepo = new TauriNoteRepository(folderPath)
  return currentRepo
}

/** 获取当前仓储实例（未打开文件夹时为 null） */
export function getCurrentRepo(): TauriNoteRepository | null {
  return currentRepo
}
