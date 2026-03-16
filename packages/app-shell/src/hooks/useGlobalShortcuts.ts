import { useEffect } from 'react'

export interface GlobalShortcutActions {
  onSearch: () => void
  onNewNote: () => void
  onToggleSidebar: () => void
  onShowHelp: () => void
}

function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function useGlobalShortcuts(actions: GlobalShortcutActions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // Cmd+K — 搜索（在输入框中也生效）
      if (mod && e.key === 'k') {
        e.preventDefault()
        actions.onSearch()
        return
      }

      // Cmd+N — 新建笔记
      if (mod && e.key === 'n') {
        e.preventDefault()
        actions.onNewNote()
        return
      }

      // Cmd+\ — 切换侧边栏
      if (mod && e.key === '\\') {
        e.preventDefault()
        actions.onToggleSidebar()
        return
      }

      // / — 显示快捷键帮助（仅在非输入框中）
      if (e.key === '/' && !mod && !e.shiftKey && !isInputElement(e.target)) {
        e.preventDefault()
        actions.onShowHelp()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [actions])
}
