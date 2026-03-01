import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Plus, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import type { TagSelect } from '@nicenote/shared'

import { WEB_ICON_SM_CLASS } from '../lib/class-names'
import { useNoteStore } from '../store/useNoteStore'

interface TagInputProps {
  noteId: string
  noteTags: TagSelect[]
}

export const TagInput = memo(function TagInput({ noteId, noteTags }: TagInputProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { allTags, createTag, addTagToNote, removeTagFromNote } = useNoteStore(
    useShallow((s) => ({
      allTags: s.tags,
      createTag: s.createTag,
      addTagToNote: s.addTagToNote,
      removeTagFromNote: s.removeTagFromNote,
    }))
  )

  const noteTagIds = useMemo(() => new Set(noteTags.map((t) => t.id)), [noteTags])

  const filteredTags = useMemo(() => {
    const lower = search.toLowerCase()
    return allTags.filter(
      (tag) => !noteTagIds.has(tag.id) && tag.name.toLowerCase().includes(lower)
    )
  }, [allTags, noteTagIds, search])

  const showCreateOption = useMemo(() => {
    if (!search.trim()) return false
    return !allTags.some((t) => t.name.toLowerCase() === search.toLowerCase().trim())
  }, [allTags, search])

  const handleAddExisting = useCallback(
    (tagId: string) => {
      addTagToNote(noteId, tagId)
      setSearch('')
      setIsOpen(false)
    },
    [noteId, addTagToNote]
  )

  const handleCreateAndAdd = useCallback(() => {
    const name = search.trim()
    if (!name) return
    const tag = createTag(name)
    addTagToNote(noteId, tag.id)
    setSearch('')
    setIsOpen(false)
  }, [search, noteId, createTag, addTagToNote])

  const handleRemove = useCallback(
    (tagId: string) => {
      removeTagFromNote(noteId, tagId)
    },
    [noteId, removeTagFromNote]
  )

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {noteTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground"
          style={tag.color ? { backgroundColor: tag.color + '20', color: tag.color } : undefined}
        >
          {tag.name}
          <button
            onClick={() => handleRemove(tag.id)}
            className="rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
            aria-label={t('tag.removeTag', { name: tag.name })}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {isOpen ? (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => {
              // 延迟关闭，允许点击下拉列表项
              setTimeout(() => setIsOpen(false), 200)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearch('')
                setIsOpen(false)
              } else if (e.key === 'Enter' && showCreateOption) {
                handleCreateAndAdd()
              } else if (e.key === 'Enter' && filteredTags.length > 0 && filteredTags[0]) {
                handleAddExisting(filteredTags[0].id)
              }
            }}
            placeholder={t('tag.searchOrCreate')}
            className="w-36 rounded-md border border-border bg-background px-2 py-0.5 text-xs outline-none"
          />
          {(filteredTags.length > 0 || showCreateOption) && (
            <div className="absolute top-full left-0 z-50 mt-1 max-h-40 w-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAddExisting(tag.id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-accent"
                >
                  {tag.color && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                  {tag.name}
                </button>
              ))}
              {showCreateOption && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCreateAndAdd}
                  className="flex w-full items-center gap-2 border-t border-border px-3 py-1.5 text-left text-xs text-primary hover:bg-accent"
                >
                  <Plus className="h-3 w-3" />
                  {t('tag.createTag', { name: search.trim() })}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleOpen}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className={WEB_ICON_SM_CLASS} />
          {t('tag.addTag')}
        </button>
      )}
    </div>
  )
})
