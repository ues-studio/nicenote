import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useShallow } from 'zustand/react/shallow'

import {
  EditorErrorBoundary,
  NotesSidebar,
  SearchDialog,
  ShortcutsHelpModal,
  Toasts,
  useAppShell,
  useGlobalShortcuts,
} from '@nicenote/app-shell'

import { WelcomePage } from './components/WelcomePage'
import { useTauriEvents } from './hooks/useTauriEvents'
import { DesktopAppShellProvider } from './providers/AppShellProvider'
import { useDesktopStore } from './store/useDesktopStore'

// 懒加载编辑器
const NoteEditorPane = lazy(() =>
  import('@nicenote/app-shell').then((m) => ({ default: m.NoteEditorPane }))
)

function AppContent() {
  const { t } = useTranslation()

  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), [])

  const { sidebar } = useAppShell()

  const { searchOpen, setSearchOpen, createNote } = useDesktopStore(
    useShallow((s) => ({
      searchOpen: s.searchOpen,
      setSearchOpen: s.setSearchOpen,
      createNote: s.createNote,
    }))
  )

  const handleCloseSearch = useCallback(() => setSearchOpen(false), [setSearchOpen])

  const shortcutActions = useMemo(
    () => ({
      onSearch: () => setSearchOpen(true),
      onNewNote: () => createNote(),
      onToggleSidebar: () => sidebar.toggle(),
      onShowHelp: () => setShortcutsOpen((prev) => !prev),
    }),
    [setSearchOpen, createNote, sidebar]
  )

  useGlobalShortcuts(shortcutActions)

  const handleShowShortcuts = useCallback(() => setShortcutsOpen(true), [])

  const gridColumns = sidebar.isOpen ? `${sidebar.width}px 1fr` : '48px 1fr'

  return (
    <div
      className="grid h-screen"
      style={{
        gridTemplateColumns: gridColumns,
        transition: 'grid-template-columns 300ms ease-in-out',
      }}
    >
      <NotesSidebar onShowShortcuts={handleShowShortcuts} />

      <EditorErrorBoundary>
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
              {t('editor.loadingEditor')}
            </div>
          }
        >
          <NoteEditorPane />
        </Suspense>
      </EditorErrorBoundary>

      <SearchDialog open={searchOpen} onClose={handleCloseSearch} />
      <ShortcutsHelpModal open={shortcutsOpen} onClose={closeShortcuts} />
      <Toasts />
    </div>
  )
}

export default function App() {
  const { currentFolder, loadSettings, loadFavorites, loadTagColors } = useDesktopStore(
    useShallow((s) => ({
      currentFolder: s.currentFolder,
      loadSettings: s.loadSettings,
      loadFavorites: s.loadFavorites,
      loadTagColors: s.loadTagColors,
    }))
  )

  // 启动时加载设置、收藏和标签颜色
  useEffect(() => {
    loadSettings()
    loadFavorites()
    loadTagColors()
  }, [loadSettings, loadFavorites, loadTagColors])

  // 注册 Tauri 文件监听事件
  useTauriEvents()

  // 未打开文件夹时显示欢迎页
  if (!currentFolder) {
    return <WelcomePage />
  }

  return (
    <DesktopAppShellProvider>
      <AppContent />
    </DesktopAppShellProvider>
  )
}
