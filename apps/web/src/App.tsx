import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Trash2, FileText, ArrowRightFromLine } from 'lucide-react'
import { useNoteStore } from './store/useNoteStore'
import type { Note } from './store/useNoteStore'
import { Editor } from '@nicenote/editor'
import { debounce } from 'lodash'
import { formatDistanceToNow } from 'date-fns'
import { useTheme } from './hooks/useTheme'
import { ThemeToggle } from './components/ThemeToggle'

export default function App() {
  // Initialize theme management
  useTheme()
  const {
    notes,
    currentNote,
    isLoading,
    fetchNotes,
    selectNote,
    createNote,
    updateNoteLocal,
    saveNote,
    deleteNote,
  } = useNoteStore()

  const [search, setSearch] = useState('')
  const [, setTick] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(320) // 默认宽度为320px
  const [isResizing, setIsResizing] = useState(false)

  // Refresh every minute to update "1 minute ago" dynamically
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Debounced save function
  const debouncedSave = useCallback(
    (id: string, updates: Partial<Note>) => {
      const debouncedFn = debounce((noteId: string, noteUpdates: Partial<Note>) => {
        saveNote(noteId, noteUpdates)
      }, 1000)
      debouncedFn(id, updates)
    },
    [saveNote]
  )

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // 处理拖拽调整宽度的逻辑
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !isSidebarOpen) return

      const newWidth = e.clientX
      // 设置最小宽度为240px，最大宽度为500px
      const minWidth = 260
      const maxWidth = 560

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      // 防止在拖拽过程中选中文本
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
    }
  }, [isResizing, isSidebarOpen])

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  const filteredNotes = sortedNotes.filter(
    (n) =>
      (n.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (n.content?.toLowerCase() || '').includes(search.toLowerCase())
  )

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentNote) return
    const newTitle = e.target.value
    updateNoteLocal(currentNote.id, { title: newTitle })
    debouncedSave(currentNote.id, { title: newTitle })
  }

  const handleContentChange = (newContent: string) => {
    if (!currentNote) return
    updateNoteLocal(currentNote.id, { content: newContent })
    debouncedSave(currentNote.id, { content: newContent })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Expand Button - Visible when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 p-2 rounded-md bg-background hover:bg-accent transition-colors shadow-sm"
        >
          <ArrowRightFromLine className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-background transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: isSidebarOpen ? `${sidebarWidth}px` : undefined }}
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 rounded-md hover:bg-accent transition-colors"
              >
                <ArrowRightFromLine
                  className={`w-5 h-5 transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <h1 className="text-xl font-semibold">Nicenote</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => createNote()}
                disabled={isLoading}
                className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search notes..."
              className="w-full pl-9 pr-4 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          {isLoading && notes.length === 0
            ? // Skeleton Loading
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 space-y-2 rounded-md animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-muted" />
                    <div className="w-2/3 h-4 rounded bg-muted" />
                  </div>
                  <div className="ml-6 w-1/2 h-3 rounded bg-muted" />
                </div>
              ))
            : filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`group p-3 rounded-md transition-all cursor-pointer ${
                    currentNote?.id === note.id
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText
                        className={`w-4 h-4 shrink-0 ${currentNote?.id === note.id ? 'text-primary' : 'opacity-50'}`}
                      />
                      <span
                        className={`font-medium truncate ${currentNote?.id === note.id ? 'text-foreground' : ''}`}
                      >
                        {note.title || 'Untitled'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Are you sure you want to delete this note?')) {
                          deleteNote(note.id)
                        }
                      }}
                      className={`p-1.5 rounded-md transition-all shrink-0 hover:bg-destructive/10 hover:text-destructive ${
                        currentNote?.id === note.id
                          ? 'opacity-100'
                          : 'opacity-30 group-hover:opacity-100'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="flex-1 text-xs truncate opacity-70">
                      {note.content ? note.content.substring(0, 40) : 'No content'}
                    </p>
                    <span className="ml-2 text-[10px] opacity-50 whitespace-nowrap">
                      {note.updatedAt
                        ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })
                        : ''}
                    </span>
                  </div>
                </div>
              ))}
          {!isLoading && filteredNotes.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">No notes found</p>
            </div>
          )}
        </div>
        {/* Resize Handle - 仅在桌面端显示 */}
        {!isMobile && (
          <div
            className="absolute top-0 right-0 z-50 h-full w-px bg-border hover:bg-primary cursor-col-resize transition-all duration-100"
            onMouseDown={() => setIsResizing(true)}
            style={{
              width: isResizing ? '3px' : '1px',
              right: isResizing ? '-1.5px' : '-0.5px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.width = '3px')}
            onMouseLeave={(e) => (e.currentTarget.style.width = isResizing ? '3px' : '1px')}
          />
        )}
      </aside>

      {/* Main Content */}
      <main
        className="flex flex-col flex-1 transition-all duration-300"
        style={{ marginLeft: isSidebarOpen ? `${sidebarWidth}px` : 0 }}
      >
        {currentNote ? (
          <>
            <div className="px-8 pt-12 pb-4">
              <input
                type="text"
                className="w-full text-4xl font-bold border-none focus:ring-0 placeholder:text-muted-foreground/30"
                placeholder="Note Title"
                value={currentNote.title}
                onChange={handleTitleChange}
              />
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span>
                  Updated{' '}
                  {currentNote.updatedAt
                    ? formatDistanceToNow(new Date(currentNote.updatedAt), { addSuffix: true })
                    : 'Unknown'}
                </span>
              </div>
            </div>
            <div className="flex-1 px-8 pb-8 overflow-hidden">
              <Editor initialContent={currentNote.content || ''} onChange={handleContentChange} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-muted">
              <FileText className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-lg font-medium">Select a note to view or edit</p>
            <p className="text-sm opacity-70">Choose from the sidebar or create a new one</p>
            <button
              onClick={() => createNote()}
              className="flex items-center gap-2 px-4 py-2 mt-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Note
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
