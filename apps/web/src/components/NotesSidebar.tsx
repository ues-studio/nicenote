import { memo, useCallback, useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Locale } from 'date-fns'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRightFromLine, Plus, Search, Trash2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import type { NoteListItem as NoteListItemType } from '@nicenote/shared'

import { useMinuteTicker } from '../hooks/useMinuteTicker'
import { WEB_ICON_MD_CLASS, WEB_ICON_SM_CLASS, WEB_ROW_WITH_ICON_CLASS } from '../lib/class-names'
import { getDateLocale } from '../lib/date-locale'
import { useNoteStore } from '../store/useNoteStore'
import { useSidebarStore } from '../store/useSidebarStore'

import { SettingsDropdown } from './SettingsDropdown'

interface NotesSidebarProps {
  isMobile: boolean
  onShowShortcuts?: () => void
  onExportAll?: () => void
  onImport?: () => void
}

interface NoteListItemProps {
  note: NoteListItemType
  isActive: boolean
  onSelect: (note: NoteListItemType) => void
  onDelete: (id: string) => void
  untitledLabel: string
  deleteLabel: string
  dateLocale: Locale
}

const NoteListItem = memo(function NoteListItem({
  note,
  isActive,
  onSelect,
  onDelete,
  untitledLabel,
  deleteLabel,
  dateLocale,
}: NoteListItemProps) {
  useMinuteTicker()

  return (
    <li
      role="listitem"
      className={`group relative flex flex-col rounded-md p-3 transition-all ${
        isActive
          ? 'bg-accent shadow-sm'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      }`}
    >
      <button
        onClick={() => onSelect(note)}
        className="w-full cursor-pointer text-left outline-none"
      >
        <div className="truncate pr-8 font-medium text-muted-foreground">
          {note.title || untitledLabel}
        </div>
        {note.summary && (
          <p className="mt-0.5 line-clamp-2 pr-8 text-xs leading-relaxed text-muted-foreground/60">
            {note.summary}
          </p>
        )}
        <div className="mt-1">
          <span className="text-caption whitespace-nowrap opacity-50">
            {formatDistanceToNow(new Date(note.updatedAt), {
              addSuffix: true,
              locale: dateLocale,
            })}
          </span>
        </div>
      </button>
      <button
        aria-label={deleteLabel.replace('{{title}}', note.title || untitledLabel)}
        onClick={() => onDelete(note.id)}
        className={`absolute top-3 right-3 shrink-0 rounded-md p-1.5 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-primary/50 ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
        }`}
      >
        <Trash2 className={WEB_ICON_SM_CLASS} />
      </button>
    </li>
  )
})

export function NotesSidebar({
  isMobile,
  onShowShortcuts,
  onExportAll,
  onImport,
}: NotesSidebarProps) {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const { isOpen, width, isResizing, toggle, open, setWidth, startResize, stopResize } =
    useSidebarStore(
      useShallow((s) => ({
        isOpen: s.isOpen,
        width: s.width,
        isResizing: s.isResizing,
        toggle: s.toggle,
        open: s.open,
        setWidth: s.setWidth,
        startResize: s.startResize,
        stopResize: s.stopResize,
      }))
    )

  // 暂无数据源
  const notes = useMemo<NoteListItemType[]>(() => [], [])

  const selectedNoteId = useNoteStore((s) => s.selectedNoteId)
  const selectNote = useNoteStore((s) => s.selectNote)

  const dateLocale = useMemo(() => getDateLocale(i18n.language), [i18n.language])
  const untitledLabel = t('sidebar.untitled')
  const deleteLabel = t('sidebar.deleteNote', { title: '{{title}}' })

  const handleSelectNote = useCallback(
    (note: NoteListItemType) => {
      selectNote(note.id)
      if (isMobile) useSidebarStore.getState().close()
    },
    [selectNote, isMobile]
  )

  const handleDeleteNote = useCallback((_id: string) => {
    // TODO: 接入新数据源后实现删除逻辑
  }, [])

  const handleCreateNote = useCallback(() => {
    // TODO: 接入新数据源后实现创建笔记逻辑
  }, [])

  const filteredNotes = useMemo(() => {
    const normalizedSearch = deferredSearch.toLowerCase()
    return notes.filter((note) => note.title.toLowerCase().includes(normalizedSearch))
  }, [deferredSearch, notes])

  // 拖拽调整宽度
  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      startResize()
    },
    [startResize]
  )

  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isResizing) return
      setWidth(e.clientX)
    },
    [isResizing, setWidth]
  )

  const handleResizePointerUp = useCallback(() => {
    if (!isResizing) return
    stopResize()
  }, [isResizing, stopResize])

  const sidebarContent = (
    <>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div className={WEB_ROW_WITH_ICON_CLASS}>
            <button
              onClick={toggle}
              aria-label={isOpen ? t('sidebar.closeSidebar') : t('sidebar.openSidebar')}
              className="rounded-md p-1.5 transition-colors outline-none hover:bg-accent"
            >
              <ArrowRightFromLine
                className={`${WEB_ICON_MD_CLASS} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <h1 className="text-xl font-semibold">Nicenote</h1>
          </div>
          <div className={WEB_ROW_WITH_ICON_CLASS}>
            <SettingsDropdown
              {...(onShowShortcuts ? { onShowShortcuts } : {})}
              {...(onExportAll ? { onExportAll } : {})}
              {...(onImport ? { onImport } : {})}
            />
            <button
              onClick={handleCreateNote}
              aria-label={t('sidebar.newNote')}
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
            placeholder={t('sidebar.searchNotes')}
            aria-label={t('sidebar.searchNotesLabel')}
            className="w-full py-2 pr-4 pl-9 text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ul role="list" className="flex-1 space-y-1 overflow-y-auto p-2">
        {filteredNotes.map((note) => (
          <NoteListItem
            key={note.id}
            note={note}
            isActive={selectedNoteId === note.id}
            onSelect={handleSelectNote}
            onDelete={handleDeleteNote}
            untitledLabel={untitledLabel}
            deleteLabel={deleteLabel}
            dateLocale={dateLocale}
          />
        ))}
        {filteredNotes.length === 0 && (
          <li className="py-12 text-center text-muted-foreground">
            <p className="text-sm">{t('sidebar.noNotesFound')}</p>
          </li>
        )}
      </ul>
    </>
  )

  if (isMobile) {
    return (
      <>
        {!isOpen && (
          <button
            onClick={open}
            aria-label={t('sidebar.openSidebar')}
            className="fixed top-4 left-4 z-50 rounded-md bg-background p-2 shadow-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <ArrowRightFromLine className={WEB_ICON_MD_CLASS} />
          </button>
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-muted transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ width: 280 }}
        >
          {sidebarContent}
        </aside>
      </>
    )
  }

  return (
    <aside className="relative flex h-full flex-col overflow-hidden border-r border-border bg-muted">
      <div
        className={`absolute inset-y-0 left-0 flex w-12 justify-center pt-4 transition-opacity duration-300 ${
          isOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <button
          onClick={toggle}
          aria-label={t('sidebar.openSidebar')}
          className="h-fit rounded-md p-1.5 transition-colors outline-none hover:bg-accent"
        >
          <ArrowRightFromLine
            className={`${WEB_ICON_MD_CLASS} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <div
        className={`flex flex-1 flex-col overflow-hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ minWidth: width }}
      >
        {sidebarContent}
      </div>

      {isOpen && (
        <div
          className={`absolute top-0 right-0 z-50 h-full cursor-col-resize bg-border transition-all duration-100 hover:bg-primary ${
            isResizing ? 'w-0.75' : 'w-px hover:w-0.75'
          }`}
          style={{ right: isResizing ? '-1.5px' : '-0.5px' }}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
        />
      )}
    </aside>
  )
}
