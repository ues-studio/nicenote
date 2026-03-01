import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  Check,
  Download,
  Keyboard,
  Languages,
  Monitor,
  Moon,
  Search,
  Settings,
  Sun,
  Upload,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nicenote/ui'

import { WEB_ICON_BUTTON_CLASS, WEB_ICON_MD_CLASS, WEB_ICON_SM_CLASS } from '../lib/class-names'
import { useLanguageStore } from '../store/useLanguageStore'
import { useThemeStore } from '../store/useThemeStore'

// 支持的语言列表（native 名 + 英文名）
const LANGUAGES = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'zh', nativeName: '中文', englishName: 'Chinese' },
] as const

type LanguageCode = (typeof LANGUAGES)[number]['code']

interface SettingsDropdownProps {
  onShowShortcuts?: () => void
  onExportAll?: () => void
  onImport?: () => void
}

export function SettingsDropdown({
  onShowShortcuts,
  onExportAll,
  onImport,
}: SettingsDropdownProps) {
  const { t } = useTranslation()

  const { theme, setTheme } = useThemeStore(
    useShallow((s) => ({
      theme: s.theme,
      setTheme: s.setTheme,
    }))
  )
  const { language, setLanguage } = useLanguageStore(
    useShallow((s) => ({
      language: s.language,
      setLanguage: s.setLanguage,
    }))
  )

  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')

  // 过滤语言列表
  const filtered = LANGUAGES.filter(
    ({ nativeName, englishName }) =>
      nativeName.toLowerCase().includes(search.toLowerCase()) ||
      englishName.toLowerCase().includes(search.toLowerCase())
  )

  const handleClose = () => {
    setPickerOpen(false)
    setSearch('')
  }

  // Escape 关闭弹层
  useEffect(() => {
    if (!pickerOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [pickerOpen])

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code)
    handleClose()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={t('settings.title')}
            className={`${WEB_ICON_BUTTON_CLASS} focus-visible:ring-2 focus-visible:ring-primary`}
          >
            <Settings className={WEB_ICON_MD_CLASS} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent portal align="end" className="w-48 border border-border p-1">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {t('settings.theme')}
          </div>
          {/* 主题分段控件：浅色 / 深色 / 跟随系统 */}
          <div className="flex gap-1 px-2 pb-1.5">
            {(
              [
                { value: 'light', icon: Sun, label: t('settings.light') },
                { value: 'dark', icon: Moon, label: t('settings.dark') },
                { value: 'system', icon: Monitor, label: t('settings.system') },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                aria-label={label}
                title={label}
                onClick={() => setTheme(value)}
                className={`flex flex-1 cursor-pointer items-center justify-center rounded-md p-1.5 transition-colors ${
                  theme === value
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                }`}
              >
                <Icon className={WEB_ICON_SM_CLASS} />
              </button>
            ))}
          </div>

          <div className="my-1 h-px bg-border" />

          {/* 语言选择入口 */}
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
            onSelect={() => setPickerOpen(true)}
          >
            <Languages className={WEB_ICON_SM_CLASS} />
            <span className="flex-1 text-left">{t('settings.language')}</span>
          </DropdownMenuItem>

          <div className="my-1 h-px bg-border" />

          {onImport && (
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
              onSelect={onImport}
            >
              <Upload className={WEB_ICON_SM_CLASS} />
              <span className="flex-1 text-left">{t('import.title')}</span>
            </DropdownMenuItem>
          )}
          {onExportAll && (
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
              onSelect={onExportAll}
            >
              <Download className={WEB_ICON_SM_CLASS} />
              <span className="flex-1 text-left">{t('export.exportAll')}</span>
            </DropdownMenuItem>
          )}
          {onShowShortcuts && (
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
              onSelect={onShowShortcuts}
            >
              <Keyboard className={WEB_ICON_SM_CLASS} />
              <span className="flex-1 text-left">{t('shortcuts.title')}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 语言选择弹层 */}
      {pickerOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={handleClose}
          >
            {/* 虚化背景遮罩 */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            {/* 弹层主体 */}
            <div
              className="relative w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 搜索框 */}
              <div className="flex items-center gap-2 border-b border-border px-3 py-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('settings.searchLanguage')}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              {/* 语言列表 */}
              <div className="max-h-80 overflow-y-auto">
                {filtered.map(({ code, nativeName, englishName }) => (
                  <button
                    key={code}
                    onClick={() => handleSelectLanguage(code)}
                    className={`flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-accent ${
                      language === code ? 'bg-accent/40' : ''
                    }`}
                  >
                    <span>{nativeName}</span>
                    {language === code ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-muted-foreground">{englishName}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
