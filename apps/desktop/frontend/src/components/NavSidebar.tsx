import { useCallback } from 'react'

import { FileText, FolderTree, Search, Settings, Star, Tag } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import { cn } from '@nicenote/ui'

import type { CurrentView } from '../store/useDesktopStore'
import { useDesktopStore } from '../store/useDesktopStore'

// ============================================================
// 导航图标配置
// ============================================================

interface NavItem {
  view: CurrentView
  icon: React.ReactNode
  label: string
  tooltip: string
}

const NAV_ITEMS: NavItem[] = [
  {
    view: 'all',
    icon: <FileText className="h-5 w-5" />,
    label: '笔记',
    tooltip: '所有笔记',
  },
  {
    view: 'tags',
    icon: <Tag className="h-5 w-5" />,
    label: '标签',
    tooltip: '按标签浏览',
  },
  {
    view: 'favorites',
    icon: <Star className="h-5 w-5" />,
    label: '收藏',
    tooltip: '收藏的笔记',
  },
  {
    view: 'folder-tree',
    icon: <FolderTree className="h-5 w-5" />,
    label: '目录',
    tooltip: '文件夹树',
  },
]

// ============================================================
// 组件
// ============================================================

export function NavSidebar() {
  const { currentView, setCurrentView, setSearchOpen, sidebarOpen, toggleSidebar } =
    useDesktopStore(
      useShallow((s) => ({
        currentView: s.currentView,
        setCurrentView: s.setCurrentView,
        setSearchOpen: s.setSearchOpen,
        sidebarOpen: s.sidebarOpen,
        toggleSidebar: s.toggleSidebar,
      }))
    )

  const handleNavClick = useCallback(
    (view: CurrentView) => {
      if (currentView === view && sidebarOpen) {
        // 点击当前激活项：收起侧边栏
        toggleSidebar()
      } else {
        setCurrentView(view)
        if (!sidebarOpen) toggleSidebar()
      }
    },
    [currentView, sidebarOpen, setCurrentView, toggleSidebar]
  )

  const handleSearchClick = useCallback(() => {
    setSearchOpen(true)
  }, [setSearchOpen])

  return (
    <nav
      className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-border bg-muted py-3"
      aria-label="主导航"
    >
      {/* 搜索按钮（独立，不关联 view） */}
      <NavButton
        icon={<Search className="h-5 w-5" />}
        label="搜索"
        tooltip="搜索笔记 (Ctrl+K)"
        isActive={false}
        onClick={handleSearchClick}
      />

      <div className="my-1 h-px w-8 bg-border" aria-hidden="true" />

      {/* 视图导航按钮 */}
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.view}
          icon={item.icon}
          label={item.label}
          tooltip={item.tooltip}
          isActive={currentView === item.view && sidebarOpen}
          onClick={() => handleNavClick(item.view)}
        />
      ))}

      {/* 底部：设置按钮 */}
      <div className="mt-auto">
        <SettingsButton />
      </div>
    </nav>
  )
}

// ============================================================
// 导航按钮
// ============================================================

interface NavButtonProps {
  icon: React.ReactNode
  label: string
  tooltip: string
  isActive: boolean
  onClick: () => void
}

function NavButton({ icon, label, tooltip, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      aria-label={tooltip}
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-center transition-colors w-12',
        isActive
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      )}
    >
      {icon}
      <span className="text-[10px] leading-tight">{label}</span>
    </button>
  )
}

// ============================================================
// 设置按钮（底部）
// ============================================================

function SettingsButton() {
  const saveSettings = useDesktopStore((s) => s.saveSettings)
  const settings = useDesktopStore((s) => s.settings)

  const handleToggleTheme = useCallback(() => {
    // 循环切换：system → light → dark → system
    const next: Record<string, 'system' | 'light' | 'dark'> = {
      system: 'light',
      light: 'dark',
      dark: 'system',
    }
    saveSettings({ theme: next[settings.theme] })
  }, [settings.theme, saveSettings])

  const themeLabel: Record<string, string> = {
    system: '跟随系统',
    light: '浅色',
    dark: '深色',
  }

  return (
    <button
      onClick={handleToggleTheme}
      title={`主题：${themeLabel[settings.theme]}（点击切换）`}
      aria-label={`切换主题，当前：${themeLabel[settings.theme]}`}
      className="flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-center text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground w-12"
    >
      <Settings className="h-5 w-5" />
      <span className="text-[10px] leading-tight">设置</span>
    </button>
  )
}
