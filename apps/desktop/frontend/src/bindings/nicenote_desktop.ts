// 手写 TypeScript 类型包装层，直接调用 @wailsio/runtime
// 方法 ID 来自自动生成的 nicenote-desktop/appservice.js（已 .gitignore）
// 如果 Go API 有变更，需同步更新本文件（重新运行 generate:bindings 获取新 ID）

import { Call } from '@wailsio/runtime'

// ============================================================
// 数据类型
// ============================================================

export interface NoteFile {
  path: string
  title: string
  summary: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface NoteContent extends NoteFile {
  content: string
  rawContent: string
}

export interface FolderNode {
  path: string
  name: string
  children: FolderNode[]
  noteCount: number
}

export interface SearchResult {
  path: string
  title: string
  snippet: string
  tags: string[]
  updatedAt: string
}

export interface Settings {
  theme: string
  language: string
}

// ============================================================
// AppService IPC 方法（方法 ID 来自 Wails3 生成的 bindings）
// ============================================================

export const AppService = {
  OpenFolderDialog: (): Promise<string> => Call.ByID(1082265418) as Promise<string>,

  GetRecentFolders: (): Promise<string[]> => Call.ByID(2925558482) as Promise<string[]>,
  AddRecentFolder: (path: string): Promise<void> => Call.ByID(2721977650, path) as Promise<void>,
  RevealInExplorer: (path: string): Promise<void> => Call.ByID(3560653819, path) as Promise<void>,

  ListNotes: (folderPath: string): Promise<NoteFile[]> =>
    Call.ByID(3334466307, folderPath) as Promise<NoteFile[]>,
  GetNoteContent: (path: string): Promise<NoteContent> =>
    Call.ByID(1680251611, path) as Promise<NoteContent>,
  SaveNote: (path: string, content: string, tags: string[]): Promise<void> =>
    Call.ByID(1592610343, path, content, tags) as Promise<void>,
  CreateNote: (folderPath: string): Promise<NoteFile> =>
    Call.ByID(4174655258, folderPath) as Promise<NoteFile>,
  RenameNote: (oldPath: string, newTitle: string): Promise<NoteFile> =>
    Call.ByID(1353096160, oldPath, newTitle) as Promise<NoteFile>,
  DeleteNote: (path: string): Promise<void> => Call.ByID(189119533, path) as Promise<void>,

  SearchNotes: (folderPath: string, query: string): Promise<SearchResult[]> =>
    Call.ByID(4172956135, folderPath, query) as Promise<SearchResult[]>,

  GetFolderTree: (rootPath: string): Promise<FolderNode> =>
    Call.ByID(2704212826, rootPath) as Promise<FolderNode>,

  WatchFolder: (folderPath: string): Promise<void> =>
    Call.ByID(3708282001, folderPath) as Promise<void>,

  GetSettings: (): Promise<Settings> => Call.ByID(3018893939) as Promise<Settings>,
  SaveSettings: (settings: Settings): Promise<void> =>
    Call.ByID(3784651466, settings) as Promise<void>,

  GetTagColors: (): Promise<Record<string, string>> =>
    Call.ByID(2193551966) as Promise<Record<string, string>>,
  SetTagColor: (tag: string, color: string): Promise<void> =>
    Call.ByID(466096837, tag, color) as Promise<void>,

  GetFavorites: (): Promise<string[]> => Call.ByID(1863012763) as Promise<string[]>,
  ToggleFavorite: (path: string): Promise<void> => Call.ByID(1461788062, path) as Promise<void>,
}
