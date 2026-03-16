import type { NoteRepository } from '@nicenote/domain'
import type {
  NoteCreateInput,
  NoteListItem,
  NoteListQuery,
  NoteListResult,
  NoteSearchQuery,
  NoteSearchResult,
  NoteSelect,
  NoteUpdateInput,
} from '@nicenote/shared'
import { generateSummary } from '@nicenote/shared'

import type { NoteContent, NoteFile } from '../bindings/tauri'
import { AppService } from '../bindings/tauri'

// ============================================================
// NoteFile / NoteContent → 领域类型映射
// ============================================================

function noteFileToListItem(note: NoteFile): NoteListItem {
  return {
    id: note.path,
    title: note.title,
    summary: note.summary,
    folderId: null,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    tags: note.tags,
  }
}

function noteContentToSelect(note: NoteContent): NoteSelect {
  return {
    id: note.path,
    title: note.title,
    content: note.content,
    folderId: null,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }
}

// ============================================================
// TauriNoteRepository：基于 Tauri IPC 的 NoteRepository 实现
// ============================================================

/**
 * 基于 Tauri IPC 的 NoteRepository 实现（Desktop 端）
 *
 * - id = 文件 path
 * - 每次切换文件夹时创建新实例
 */
export class TauriNoteRepository implements NoteRepository {
  constructor(private folderPath: string) {}

  async list(query: NoteListQuery): Promise<NoteListResult> {
    let notes = await AppService.ListNotes(this.folderPath)

    // 按更新时间倒序
    notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    // 标签过滤（tagId 在此上下文中是标签名）
    if (query.tagId) {
      notes = notes.filter((n) => n.tags.includes(query.tagId!))
    }

    // 游标分页
    if (query.cursor && query.cursorId) {
      const idx = notes.findIndex((n) => n.updatedAt <= query.cursor! && n.path !== query.cursorId)
      if (idx > 0) notes = notes.slice(idx)
    }

    const limit = query.limit ?? 50
    const page = notes.slice(0, limit + 1)
    const hasNext = page.length > limit
    const data = page.slice(0, limit).map(noteFileToListItem)

    const last = data[data.length - 1]
    return {
      data,
      nextCursor: hasNext && last ? last.updatedAt : null,
      nextCursorId: hasNext && last ? last.id : null,
    }
  }

  async get(id: string): Promise<NoteSelect | null> {
    try {
      const content = await AppService.GetNoteContent(id)
      return noteContentToSelect(content)
    } catch {
      return null
    }
  }

  async create(_input: NoteCreateInput): Promise<NoteSelect> {
    const newNote = await AppService.CreateNote(this.folderPath)
    return {
      id: newNote.path,
      title: newNote.title,
      content: null,
      folderId: null,
      createdAt: newNote.createdAt,
      updatedAt: newNote.updatedAt,
    }
  }

  async update(id: string, input: NoteUpdateInput): Promise<NoteSelect> {
    let currentPath = id

    // 标题变更 → 重命名文件
    if (input.title !== undefined) {
      const renamed = await AppService.RenameNote(currentPath, input.title)
      currentPath = renamed.path
    }

    // 内容或标签变更 → 保存文件
    if (input.content !== undefined || input.tags !== undefined) {
      // 需要获取当前笔记状态来补全参数
      const current = await AppService.GetNoteContent(currentPath)
      const content = input.content ?? current.content
      const tags = input.tags ?? current.tags
      await AppService.SaveNote(currentPath, content, tags)
    }

    // 返回最新状态
    const updated = await AppService.GetNoteContent(currentPath)
    return noteContentToSelect(updated)
  }

  async delete(id: string): Promise<void> {
    await AppService.DeleteNote(id)
  }

  async search(query: NoteSearchQuery): Promise<NoteSearchResult[]> {
    const results = await AppService.SearchNotes(this.folderPath, query.q)
    const limit = query.limit ?? 20
    return results.slice(0, limit).map((r) => ({
      id: r.path,
      title: r.title,
      summary: generateSummary(r.snippet) || null,
      folderId: null,
      createdAt: r.updatedAt,
      updatedAt: r.updatedAt,
      snippet: r.snippet,
      tags: r.tags,
    }))
  }
}
