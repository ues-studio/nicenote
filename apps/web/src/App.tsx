import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Trash2, FileText, Loader2 } from 'lucide-react'
import { useNoteStore } from './store/useNoteStore'
import type { Note } from './store/useNoteStore'
import Editor from './components/Editor'
import { debounce } from 'lodash'
import { formatDistanceToNow } from 'date-fns'

export default function App() {
  const { 
    notes, 
    currentNote, 
    isLoading, 
    fetchNotes, 
    selectNote, 
    createNote, 
    updateNoteLocal, 
    saveNote, 
    deleteNote 
  } = useNoteStore()

  const [search, setSearch] = useState('')

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((id: string, updates: Partial<Note>) => {
      saveNote(id, updates)
    }, 1000),
    [saveNote]
  )

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  const filteredNotes = sortedNotes.filter(n => 
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
    <div className="flex h-screen w-full bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border flex flex-col bg-muted/30">
        <div className="p-4 border-b border-border flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">Nicenote</h1>
            <button 
              onClick={() => createNote()}
              disabled={isLoading}
              className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search notes..."
              className="w-full bg-background rounded-md border border-input pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading && notes.length === 0 ? (
            // Skeleton Loading
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full p-3 rounded-md animate-pulse space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
                <div className="h-3 bg-muted rounded w-1/2 ml-6" />
              </div>
            ))
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                className={`w-full text-left p-3 rounded-md transition-all group cursor-pointer ${
                  currentNote?.id === note.id 
                  ? 'bg-accent text-accent-foreground shadow-sm' 
                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className={`w-4 h-4 shrink-0 ${currentNote?.id === note.id ? 'text-primary' : 'opacity-50'}`} />
                    <span className={`font-medium truncate ${currentNote?.id === note.id ? 'text-foreground' : ''}`}>
                      {note.title || 'Untitled'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNote(note.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs truncate opacity-70 flex-1">
                    {note.content ? note.content.substring(0, 40) : 'No content'}
                  </p>
                  <span className="text-[10px] opacity-50 whitespace-nowrap ml-2">
                    {note.updatedAt ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true }) : ''}
                  </span>
                </div>
              </div>
            ))
          )}
          {!isLoading && filteredNotes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No notes found</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-background">
        {currentNote ? (
          <>
            <div className="px-8 pt-12 pb-4">
              <input
                type="text"
                className="w-full text-4xl font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/30"
                placeholder="Note Title"
                value={currentNote.title}
                onChange={handleTitleChange}
              />
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span>Updated {currentNote.updatedAt ? formatDistanceToNow(new Date(currentNote.updatedAt), { addSuffix: true }) : 'Unknown'}</span>
              </div>
            </div>
            <div className="flex-1 px-8 pb-8 overflow-hidden">
              <Editor 
                initialContent={currentNote.content || ''} 
                onChange={handleContentChange} 
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-lg font-medium">Select a note to view or edit</p>
            <p className="text-sm opacity-70">Choose from the sidebar or create a new one</p>
            <button 
              onClick={() => createNote()}
              className="mt-6 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
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
