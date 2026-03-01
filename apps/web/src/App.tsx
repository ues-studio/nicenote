import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useIsBreakpoint } from '@nicenote/ui'

import { EditorErrorBoundary } from './components/ErrorBoundary'
import { ImportDialog } from './components/ImportDialog'
import { NotesSidebar } from './components/NotesSidebar'
import { SearchDialog } from './components/SearchDialog'
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal'
import { Toasts } from './components/Toasts'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useSidebarStore } from './store/useSidebarStore'

const NoteEditorPane = lazy(() =>
  import('./components/NoteEditorPane').then((m) => ({ default: m.NoteEditorPane }))
)

export default function App() {
  const { t } = useTranslation()

  const [searchOpen, setSearchOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), [])
  const closeImport = useCallback(() => setImportOpen(false), [])

  const toggleSidebar = useSidebarStore((s) => s.toggle)

  const shortcutActions = useMemo(
    () => ({
      onSearch: () => setSearchOpen((prev) => !prev),
      onNewNote: () => {},
      onToggleSidebar: () => toggleSidebar(),
      onShowHelp: () => setShortcutsOpen((prev) => !prev),
    }),
    [toggleSidebar]
  )

  useGlobalShortcuts(shortcutActions)

  const isMobile = useIsBreakpoint('max', 768)
  const isOpen = useSidebarStore((s) => s.isOpen)
  const width = useSidebarStore((s) => s.width)
  const closeSidebar = useSidebarStore((s) => s.close)

  const mobileOverlayOpen = isMobile && isOpen
  const gridColumns = isMobile ? '0px 1fr' : isOpen ? `${width}px 1fr` : '48px 1fr'

  const handleShowShortcuts = useCallback(() => setShortcutsOpen(true), [])
  const handleImport = useCallback(() => setImportOpen(true), [])

  return (
    <div
      className="grid h-screen"
      style={{
        gridTemplateColumns: gridColumns,
        transition: 'grid-template-columns 300ms ease-in-out',
      }}
    >
      <NotesSidebar
        isMobile={isMobile}
        onShowShortcuts={handleShowShortcuts}
        onImport={handleImport}
      />

      <EditorErrorBoundary>
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              {t('editor.loadingEditor')}
            </div>
          }
        >
          <NoteEditorPane inert={mobileOverlayOpen} isMobile={isMobile} />
        </Suspense>
      </EditorErrorBoundary>

      {mobileOverlayOpen && (
        <div className="fixed inset-0 z-30 bg-black/20" onClick={closeSidebar} aria-hidden="true" />
      )}

      <SearchDialog open={searchOpen} onClose={closeSearch} />
      <ShortcutsHelpModal open={shortcutsOpen} onClose={closeShortcuts} />
      <ImportDialog open={importOpen} onClose={closeImport} />
      <Toasts />
    </div>
  )
}
