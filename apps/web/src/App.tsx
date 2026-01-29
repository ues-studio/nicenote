import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, FileText, Loader2 } from 'lucide-react'
import { useNoteStore } from './store/useNoteStore'
import type { Note } from './store/useNoteStore'

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

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    (n.content && n.content.toLowerCase().includes(search.toLowerCase()))
  )

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentNote) return
    const newTitle = e.target.value
    updateNoteLocal(currentNote.id, { title: newTitle })
    saveNote(currentNote.id, { title: newTitle })
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentNote) return
    const newContent = e.target.value
    updateNoteLocal(currentNote.id, { content: newContent })
    saveNote(currentNote.id, { content: newContent })
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
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => selectNote(note)}
              className={`w-full text-left p-3 rounded-md transition-all group ${
                currentNote?.id === note.id 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="font-medium truncate">{note.title || 'Untitled'}</span>
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
              <p className="text-xs mt-1 truncate opacity-70">
                {note.content ? note.content.substring(0, 40) : 'No content'}
              </p>
            </button>
          ))}
          {isLoading && notes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Loading notes...</p>
            </div>
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
                <span>Last updated: {new Date(currentNote.updatedAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex-1 px-8 pb-8">
              <textarea
                className="w-full h-full bg-transparent border-none focus:outline-none resize-none py-4 text-lg leading-relaxed placeholder:text-muted-foreground/30"
                placeholder="Start writing..."
                value={currentNote.content || ''}
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
