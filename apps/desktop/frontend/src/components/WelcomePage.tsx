import { memo, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { ChevronRight, Clock, FolderOpen } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import { useDesktopStore } from '../store/useDesktopStore'

export function WelcomePage() {
  const { t } = useTranslation()

  const { recentFolders, openFolder, loadRecentFolders } = useDesktopStore(
    useShallow((s) => ({
      recentFolders: s.recentFolders,
      openFolder: s.openFolder,
      loadRecentFolders: s.loadRecentFolders,
    }))
  )

  // 加载最近文件夹列表
  useEffect(() => {
    loadRecentFolders()
  }, [loadRecentFolders])

  const handleOpenFolder = useCallback(() => {
    openFolder()
  }, [openFolder])

  const handleOpenRecent = useCallback(
    (path: string) => {
      openFolder(path)
    },
    [openFolder]
  )

  // 展示最多 10 个最近文件夹
  const displayFolders = useMemo(() => recentFolders.slice(0, 10), [recentFolders])

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md px-8">
        {/* Logo 和标题 */}
        <div className="mb-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect
                  x="6"
                  y="4"
                  width="22"
                  height="28"
                  rx="3"
                  fill="currentColor"
                  className="text-primary/20"
                />
                <rect
                  x="8"
                  y="6"
                  width="22"
                  height="28"
                  rx="3"
                  fill="currentColor"
                  className="text-primary/40"
                />
                <rect
                  x="10"
                  y="8"
                  width="22"
                  height="28"
                  rx="3"
                  fill="currentColor"
                  className="text-primary"
                />
                <rect x="14" y="16" width="14" height="1.5" rx="0.75" fill="white" opacity="0.8" />
                <rect x="14" y="20" width="10" height="1.5" rx="0.75" fill="white" opacity="0.6" />
                <rect x="14" y="24" width="12" height="1.5" rx="0.75" fill="white" opacity="0.6" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('welcome.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('welcome.subtitle')}</p>
        </div>

        {/* 打开文件夹按钮 */}
        <button
          onClick={handleOpenFolder}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <FolderOpen className="h-4 w-4" />
          {t('welcome.openFolder')}
        </button>

        <p className="mt-3 text-center text-xs text-muted-foreground/60">{t('welcome.hint')}</p>

        {/* 最近打开的文件夹 */}
        {displayFolders.length > 0 && (
          <div className="mt-10">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{t('welcome.recentFolders')}</span>
            </div>
            <ul className="space-y-1">
              {displayFolders.map((folder) => (
                <RecentFolderItem key={folder} path={folder} onClick={handleOpenRecent} />
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 text-xs text-muted-foreground/40">NiceNote Desktop</div>
    </div>
  )
}

// ============================================================
// 最近文件夹列表项
// ============================================================

interface RecentFolderItemProps {
  path: string
  onClick: (path: string) => void
}

const RecentFolderItem = memo(function RecentFolderItem({ path, onClick }: RecentFolderItemProps) {
  const name = path.split(/[\\/]/).filter(Boolean).pop() ?? path
  const displayPath = path.replace(/^\/Users\/[^/]+/, '~').replace(/^C:\\Users\\[^\\]+/, '~')

  const handleClick = useCallback(() => onClick(path), [onClick, path])

  return (
    <li>
      <button
        onClick={handleClick}
        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{name}</div>
          <div className="truncate text-xs text-muted-foreground/70">{displayPath}</div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
      </button>
    </li>
  )
})
