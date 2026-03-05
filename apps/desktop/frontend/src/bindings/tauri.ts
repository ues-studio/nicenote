import { invoke } from '@tauri-apps/api/core'

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
// AppService IPC 方法（Tauri invoke，字符串命令名）
// ============================================================

export const AppService = {
  OpenFolderDialog: (): Promise<string> => invoke('open_folder_dialog'),

  GetRecentFolders: (): Promise<string[]> => invoke('get_recent_folders'),

  AddRecentFolder: (path: string): Promise<void> => invoke('add_recent_folder', { path }),

  RevealInExplorer: (path: string): Promise<void> => invoke('reveal_in_explorer', { path }),

  ListNotes: (folderPath: string): Promise<NoteFile[]> =>
    invoke('list_notes', { folder_path: folderPath }),

  GetNoteContent: (path: string): Promise<NoteContent> => invoke('get_note_content', { path }),

  SaveNote: (path: string, content: string, tags: string[]): Promise<void> =>
    invoke('save_note', { path, content, tags }),

  CreateNote: (folderPath: string): Promise<NoteFile> =>
    invoke('create_note', { folder_path: folderPath }),

  RenameNote: (oldPath: string, newTitle: string): Promise<NoteFile> =>
    invoke('rename_note', { old_path: oldPath, new_title: newTitle }),

  DeleteNote: (path: string): Promise<void> => invoke('delete_note', { path }),

  SearchNotes: (folderPath: string, query: string): Promise<SearchResult[]> =>
    invoke('search_notes', { folder_path: folderPath, query }),

  GetFolderTree: (rootPath: string): Promise<FolderNode> =>
    invoke('get_folder_tree', { root_path: rootPath }),

  WatchFolder: (folderPath: string): Promise<void> =>
    invoke('watch_folder', { folder_path: folderPath }),

  GetSettings: (): Promise<Settings> => invoke('get_settings'),

  SaveSettings: (settings: Settings): Promise<void> => invoke('save_settings', { settings }),

  GetTagColors: (): Promise<Record<string, string>> => invoke('get_tag_colors'),

  SetTagColor: (tag: string, color: string): Promise<void> =>
    invoke('set_tag_color', { tag, color }),

  GetFavorites: (): Promise<string[]> => invoke('get_favorites'),

  ToggleFavorite: (path: string): Promise<void> => invoke('toggle_favorite', { path }),
}
