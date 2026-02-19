import { lazy, Suspense, useEffect } from 'react'

import { NotesSidebar } from './components/NotesSidebar'
import { Toasts } from './components/Toasts'
import { useDebouncedNoteSave } from './hooks/useDebouncedNoteSave'
import { useSidebarLayout } from './hooks/useSidebarLayout'
import { useNoteStore } from './store/useNoteStore'

const NoteEditorPane = lazy(() =>
  import('./components/NoteEditorPane').then((m) => ({ default: m.NoteEditorPane }))
)

export default function App() {
  const fetchNotes = useNoteStore((state) => state.fetchNotes)
  const saveNote = useNoteStore((state) => state.saveNote)
  const { scheduleSave, cancelPendingSave, saveStatus } = useDebouncedNoteSave({ saveNote })
  const {
    isSidebarOpen,
    isMobile,
    sidebarWidth,
    isResizing,
    openSidebar,
    toggleSidebar,
    startResizing,
  } = useSidebarLayout()

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const mobileOverlayOpen = isMobile && isSidebarOpen

  return (
    <div className="flex h-screen overflow-hidden">
      <NotesSidebar
        isSidebarOpen={isSidebarOpen}
        isMobile={isMobile}
        sidebarWidth={sidebarWidth}
        isResizing={isResizing}
        openSidebar={openSidebar}
        toggleSidebar={toggleSidebar}
        startResizing={startResizing}
        cancelPendingSave={cancelPendingSave}
      />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Loading editor...
          </div>
        }
      >
        <NoteEditorPane
          isSidebarOpen={isSidebarOpen}
          sidebarWidth={sidebarWidth}
          scheduleSave={scheduleSave}
          saveStatus={saveStatus}
          inert={mobileOverlayOpen}
        />
      </Suspense>
      <Toasts />
    </div>
  )
}
