import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Check, FileText, Loader2, Plus, Tag, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import type { EditorLabels } from '@nicenote/editor'
import { NicenoteEditor } from '@nicenote/editor'

import { useDesktopStore } from '../store/useDesktopStore'

// ============================================================
// NoteEditor：笔记编辑区
// ============================================================

export function NoteEditor() {
  const { activeNote, saveNote, renameNote, createNote, saveState, tagColors, setTagColor } =
    useDesktopStore(
      useShallow((s) => ({
        activeNote: s.activeNote,
        saveNote: s.saveNote,
        renameNote: s.renameNote,
        createNote: s.createNote,
        saveState: s.saveState,
        tagColors: s.tagColors,
        setTagColor: s.setTagColor,
      }))
    )

  // 标题输入本地状态（通过 renameNote 防抖同步到后端）
  const [localTitle, setLocalTitle] = useState(activeNote?.title ?? '')
  const titleRef = useRef<HTMLInputElement>(null)

  // 当激活笔记切换时重置本地标题
  useEffect(() => {
    setLocalTitle(activeNote?.title ?? '')
  }, [activeNote?.path])

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setLocalTitle(val)
      renameNote(val)
    },
    [renameNote]
  )

  // 内容变更时调用防抖保存
  const handleContentChange = useCallback(
    (content: string) => {
      if (!activeNote) return
      saveNote(content, activeNote.tags)
    },
    [activeNote, saveNote]
  )

  // 标签变更
  const handleTagsChange = useCallback(
    (tags: string[]) => {
      if (!activeNote) return
      saveNote(activeNote.content, tags)
    },
    [activeNote, saveNote]
  )

  // 编辑器 labels（中文）
  const editorLabels: EditorLabels = useMemo(
    () => ({
      toolbar: {
        undo: '撤销',
        redo: '重做',
        heading: '标题',
        heading1: '一级标题',
        heading2: '二级标题',
        heading3: '三级标题',
        list: '列表',
        bulletList: '无序列表',
        orderedList: '有序列表',
        bold: '加粗',
        italic: '斜体',
        strike: '删除线',
        code: '行内代码',
        blockquote: '引用',
        link: '链接',
        sourceMode: '源码模式',
        cancel: '取消',
        apply: '应用',
      },
      content: {
        editorPlaceholder: '开始写作...',
        sourcePlaceholder: '在此输入 Markdown 内容...',
        sourceLabel: 'Markdown 源码',
      },
      translateValidationError: (key) => key,
    }),
    []
  )

  // 相对更新时间
  const updatedAtLabel = useMemo(() => {
    if (!activeNote?.updatedAt) return null
    try {
      return formatDistanceToNow(new Date(activeNote.updatedAt), {
        addSuffix: true,
        locale: zhCN,
      })
    } catch {
      return null
    }
  }, [activeNote?.updatedAt])

  // ---- 空状态 ----
  if (!activeNote) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FileText className="h-8 w-8 opacity-20" />
        </div>
        <div className="text-center">
          <p className="text-base font-medium">选择一篇笔记</p>
          <p className="mt-1 text-sm opacity-60">或者新建一篇开始写作</p>
        </div>
        <button
          onClick={createNote}
          className="mt-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          新建笔记
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 头部：标题 + 元信息 */}
      <div className="shrink-0 px-10 pt-10 pb-4">
        {/* 标题输入 */}
        <input
          ref={titleRef}
          type="text"
          value={localTitle}
          onChange={handleTitleChange}
          placeholder="无标题"
          aria-label="笔记标题"
          className="w-full border-none bg-transparent text-3xl font-bold text-foreground outline-none placeholder:text-muted-foreground/30"
        />

        {/* 元信息行：更新时间 + 保存状态 */}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground/60">
          {updatedAtLabel && <span>{updatedAtLabel}更新</span>}
          <SaveStateIndicator state={saveState} />
        </div>

        {/* 标签行 */}
        <div className="mt-3">
          <TagEditor
            tags={activeNote.tags}
            tagColors={tagColors}
            onChange={handleTagsChange}
            onSetTagColor={setTagColor}
          />
        </div>
      </div>

      {/* 编辑器主体 */}
      <div className="editor-content min-h-0 flex-1 overflow-hidden px-10 pb-10">
        <NicenoteEditor
          key={activeNote.path}
          value={activeNote.content ?? ''}
          onChange={handleContentChange}
          labels={editorLabels}
          isMobile={false}
        />
      </div>
    </div>
  )
}

// ============================================================
// 保存状态指示器
// ============================================================

interface SaveStateIndicatorProps {
  state: 'saved' | 'saving' | 'unsaved'
}

function SaveStateIndicator({ state }: SaveStateIndicatorProps) {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1 text-muted-foreground/50">
        <Loader2 className="h-3 w-3 animate-spin" />
        保存中
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1 text-muted-foreground/40">
        <Check className="h-3 w-3" />
        已保存
      </span>
    )
  }
  return <span className="text-muted-foreground/40">未保存</span>
}

// ============================================================
// 标签编辑器
// ============================================================

interface TagEditorProps {
  tags: string[]
  tagColors: Record<string, string>
  onChange: (tags: string[]) => void
  onSetTagColor: (tag: string, color: string) => void
}

function TagEditor({ tags, tagColors, onChange, onSetTagColor: _onSetTagColor }: TagEditorProps) {
  const [inputValue, setInputValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding) inputRef.current?.focus()
  }, [isAdding])

  const handleAddTag = useCallback(() => {
    const tag = inputValue.trim()
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag])
    }
    setInputValue('')
    setIsAdding(false)
  }, [inputValue, tags, onChange])

  const handleRemoveTag = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag))
    },
    [tags, onChange]
  )

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddTag()
      }
      if (e.key === 'Escape') {
        setInputValue('')
        setIsAdding(false)
      }
      // Backspace 且输入为空时，删除最后一个标签
      if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
        onChange(tags.slice(0, -1))
      }
    },
    [handleAddTag, inputValue, tags, onChange]
  )

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />

      {/* 现有标签 */}
      {tags.map((tag) => (
        <TagPill key={tag} tag={tag} color={tagColors[tag]} onRemove={() => handleRemoveTag(tag)} />
      ))}

      {/* 新增标签输入 */}
      {isAdding ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleAddTag}
          placeholder="标签名..."
          className="h-5 w-24 rounded border-0 bg-transparent px-1 text-xs text-foreground outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
        />
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          aria-label="添加标签"
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground/50 transition-colors hover:bg-accent hover:text-muted-foreground"
        >
          <Plus className="h-3 w-3" />
          添加标签
        </button>
      )}
    </div>
  )
}

// ============================================================
// 标签药丸
// ============================================================

interface TagPillProps {
  tag: string
  color?: string
  onRemove: () => void
}

function TagPill({ tag, color, onRemove }: TagPillProps) {
  const bgColor = color ? `${color}20` : 'var(--color-accent)'
  const textColor = color ?? 'var(--color-muted-foreground)'

  return (
    <span
      className="group flex items-center gap-1 rounded px-2 py-0.5 text-xs"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {tag}
      <button
        onClick={onRemove}
        aria-label={`删除标签 ${tag}`}
        className="rounded-full opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/10"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
