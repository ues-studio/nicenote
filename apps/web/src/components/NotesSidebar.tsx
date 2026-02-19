import { memo, useCallback, useDeferredValue, useMemo, useState } from 'react'

import { formatDistanceToNow } from 'date-fns'
import { ArrowRightFromLine, FileText, Plus, Search, Trash2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import type { NoteSelect } from '@nicenote/shared'

import { useMinuteTicker } from '../hooks/useMinuteTicker'
import { WEB_ICON_MD_CLASS, WEB_ICON_SM_CLASS, WEB_ROW_WITH_ICON_CLASS } from '../lib/class-names'
import { useNoteStore } from '../store/useNoteStore'

import { ConfirmDialog } from './ConfirmDialog'
import { ThemeToggle } from './ThemeToggle'

interface NotesSidebarProps {
  isSidebarOpen: boolean
  isMobile: boolean
  sidebarWidth: number
  isResizing: boolean
  openSidebar: () => void
  toggleSidebar: () => void
  startResizing: (event: React.PointerEvent<HTMLDivElement>) => void
  cancelPendingSave: (id: string) => void
}

interface NoteListItemProps {
  note: NoteSelect
  isActive: boolean
  onSelect: (note: NoteSelect) => void
  onRequestDelete: (id: string) => void
}

const NoteListItem = memo(function NoteListItem({
  note,
  isActive,
  onSelect,
  onRequestDelete,
}: NoteListItemProps) {
  return (
    <button
      onClick={() => onSelect(note)}
      className={`group w-full cursor-pointer rounded-md p-3 text-left transition-all ${
        isActive
          ? 'bg-accent shadow-sm'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={`${WEB_ROW_WITH_ICON_CLASS} overflow-hidden`}>
          <FileText className={`${WEB_ICON_SM_CLASS} shrink-0 opacity-50`} />
          <span className="truncate font-medium text-muted-foreground">
            {note.title || 'Untitled'}
          </span>
        </div>
        <div
          role="button"
          tabIndex={0}
          aria-label="Delete note"
          onClick={(e) => {
            e.stopPropagation()
            onRequestDelete(note.id)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onRequestDelete(note.id)
            }
          }}
          className={`shrink-0 rounded-md p-1.5 transition-all hover:bg-destructive/10 hover:text-destructive ${
            isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-100'
          }`}
        >
          <Trash2 className={WEB_ICON_SM_CLASS} />
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <p className="flex-1 truncate text-xs opacity-70">
          {note.content ? note.content.substring(0, 40) : 'No content'}
        </p>
        <span className="ml-2 text-caption whitespace-nowrap opacity-50">
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </button>
  )
})

export function NotesSidebar({
  isSidebarOpen,
  isMobile,
  sidebarWidth,
  isResizing,
  openSidebar,
  toggleSidebar,
  startResizing,
  cancelPendingSave,
}: NotesSidebarProps) {
  useMinuteTicker()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(search)
  const { notes, isLoading, currentNoteId } = useNoteStore(
    useShallow((state) => ({
      notes: state.notes,
      isLoading: state.isLoading,
      currentNoteId: state.currentNote?.id ?? null,
    }))
  )
  const { selectNote, createNote, deleteNote } = useNoteStore(
    useShallow((state) => ({
      selectNote: state.selectNote,
      createNote: state.createNote,
      deleteNote: state.deleteNote,
    }))
  )
  const handleDelete = useCallback(
    (id: string) => {
      cancelPendingSave(id)
      void deleteNote(id)
    },
    [cancelPendingSave, deleteNote]
  )

  const filteredNotes = useMemo(() => {
    const normalizedSearch = deferredSearch.toLowerCase()
    return [...notes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .filter(
        (note) =>
          note.title.toLowerCase().includes(normalizedSearch) ||
          (note.content ?? '').toLowerCase().includes(normalizedSearch)
      )
  }, [deferredSearch, notes])

  return (
    <>
      {!isSidebarOpen && (
        <button
          onClick={openSidebar}
          aria-label="Open sidebar"
          className="fixed top-4 left-4 z-50 rounded-md bg-background p-2 shadow-sm transition-colors hover:bg-accent focus:ring-0"
        >
          <ArrowRightFromLine className={WEB_ICON_MD_CLASS} />
        </button>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-background transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div className={WEB_ROW_WITH_ICON_CLASS}>
              <button
                onClick={toggleSidebar}
                aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                className="rounded-md p-1.5 transition-colors hover:bg-accent focus:ring-0"
              >
                <ArrowRightFromLine
                  className={`${WEB_ICON_MD_CLASS} transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <h1 className="text-xl font-semibold">Nicenote</h1>
            </div>
            <div className={WEB_ROW_WITH_ICON_CLASS}>
              <ThemeToggle />
              <button
                onClick={() => void createNote()}
                disabled={isLoading}
                aria-label="New note"
                className="rounded-md bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className={WEB_ICON_SM_CLASS} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search
              className={`absolute top-2.5 left-2.5 ${WEB_ICON_SM_CLASS} text-muted-foreground`}
            />
            <input
              type="search"
              placeholder="Search notes..."
              aria-label="Search notes"
              className="w-full py-2 pr-4 pl-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {isLoading && notes.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2 rounded-md p-3">
                  <div className={WEB_ROW_WITH_ICON_CLASS}>
                    <div className={`${WEB_ICON_SM_CLASS} rounded bg-muted`} />
                    <div className="h-4 w-2/3 rounded bg-muted" />
                  </div>
                  <div className="ml-6 h-3 w-1/2 rounded bg-muted" />
                </div>
              ))
            : filteredNotes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isActive={currentNoteId === note.id}
                  onSelect={selectNote}
                  onRequestDelete={setDeleteTarget}
                />
              ))}
          {!isLoading && filteredNotes.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">No notes found</p>
            </div>
          )}
        </div>
        {!isMobile && (
          <div
            className={`absolute top-0 right-0 z-50 h-full cursor-col-resize bg-border transition-all duration-100 hover:bg-primary ${
              isResizing ? 'w-0.75' : 'w-px hover:w-0.75'
            }`}
            onPointerDown={startResizing}
            style={{
              right: isResizing ? '-1.5px' : '-0.5px',
            }}
          />
        )}
      </aside>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget)
          setDeleteTarget(null)
        }}
      />
    </>
  )
}
