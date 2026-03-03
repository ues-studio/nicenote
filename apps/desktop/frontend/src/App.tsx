import { lazy, Suspense, useCallback, useEffect } from 'react'

import { useShallow } from 'zustand/react/shallow'

import { useWailsEvents } from './hooks/useWailsEvents'
import { useDesktopStore } from './store/useDesktopStore'

// 懒加载编辑器（较大，延迟加载以加快首屏）
const NoteEditor = lazy(() =>
  import('./components/NoteEditor').then((m) => ({ default: m.NoteEditor }))
)

import { NavSidebar } from './components/NavSidebar'
import { NoteList } from './components/NoteList'
import { SearchDialog } from './components/SearchDialog'
import { WelcomePage } from './components/WelcomePage'

export default function App() {
  const {
    currentFolder,
    sidebarOpen,
    searchOpen,
    setSearchOpen,
    toggleSidebar,
    createNote,
    loadSettings,
    loadFavorites,
    loadTagColors,
  } = useDesktopStore(
    useShallow((s) => ({
      currentFolder: s.currentFolder,
      sidebarOpen: s.sidebarOpen,
      searchOpen: s.searchOpen,
      setSearchOpen: s.setSearchOpen,
      toggleSidebar: s.toggleSidebar,
      createNote: s.createNote,
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

  // 注册 Wails 文件监听事件
  useWailsEvents()

  // 全局键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      // Cmd/Ctrl+K：打开搜索
      if (isMod && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }

      // Cmd/Ctrl+N：新建笔记
      if (isMod && e.key === 'n') {
        e.preventDefault()
        createNote()
      }

      // Cmd/Ctrl+\：切换侧边栏
      if (isMod && e.key === '\\') {
        e.preventDefault()
        toggleSidebar()
      }

      // Escape：关闭搜索
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [searchOpen, setSearchOpen, createNote, toggleSidebar])

  const handleCloseSearch = useCallback(() => setSearchOpen(false), [setSearchOpen])

  // 未打开文件夹时显示欢迎页
  if (!currentFolder) {
    return <WelcomePage />
  }

  // 三栏布局：导航栏（64px）| 笔记列表（280px）| 编辑区（fill）
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 左侧导航图标栏（64px 固定宽度） */}
      <NavSidebar />

      {/* 笔记列表面板（sidebarOpen 时显示，固定 280px） */}
      <div
        className="shrink-0 overflow-hidden border-r border-border transition-all duration-200 ease-in-out"
        style={{ width: sidebarOpen ? 280 : 0 }}
      >
        <div className="h-full w-[280px]">
          <NoteList />
        </div>
      </div>

      {/* 编辑区（占满剩余空间） */}
      <main className="flex min-w-0 flex-1 flex-col">
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
              加载编辑器...
            </div>
          }
        >
          <NoteEditor />
        </Suspense>
      </main>

      {/* 搜索对话框 */}
      <SearchDialog open={searchOpen} onClose={handleCloseSearch} />
    </div>
  )
}
