import { Moon, Sun } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import { WEB_ICON_BUTTON_CLASS, WEB_ICON_MD_CLASS } from '../lib/class-names'
import { useThemeStore } from '../store/useThemeStore'

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore(
    useShallow((s) => ({
      theme: s.theme,
      toggle: s.toggle,
    }))
  )

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`${WEB_ICON_BUTTON_CLASS} focus-visible:ring-2 focus-visible:ring-primary`}
    >
      {theme === 'dark' ? (
        <Sun className={WEB_ICON_MD_CLASS} />
      ) : (
        <Moon className={WEB_ICON_MD_CLASS} />
      )}
    </button>
  )
}
